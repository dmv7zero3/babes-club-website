#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "${SCRIPT_DIR}/../.." && pwd)
DIST_DIR="${ROOT_DIR}/dist"
LAMBDA_DIR="${ROOT_DIR}/AWS_Lambda_Functions/babes-website-cart-quote"
LAYER_DIR="${ROOT_DIR}/AWS_Lambda_Functions/shared_layers/commerce"
SAMPLE_PAYLOAD="${ROOT_DIR}/config/cart-quote-smoke-payload.json"

mkdir -p "${DIST_DIR}"

AWS_REGION=${AWS_REGION:-us-east-1}
LAMBDA_NAME=${LAMBDA_NAME:-babes-cart-quote}
LAYER_NAME=${LAYER_NAME:-marketbrewer-commerce-core}
REST_API_ID=${REST_API_ID:-a2fps4r1la}
STAGE_NAME=${STAGE_NAME:-prod}
SITE_DOMAIN=${SITE_DOMAIN:-www.thebabesclub.com}
ALARM_PREFIX=${ALARM_PREFIX:-cart-quote}
ALARM_TOPIC_ARN=${ALARM_TOPIC_ARN:-}
SKIP_LAYER=${SKIP_LAYER:-false}
EXTRA_LAYER_ARNS=${EXTRA_LAYER_ARNS:-}

ENV_FILE=${ENV_FILE:-${ROOT_DIR}/config/deploy.cart-quote.env}
if [[ -f "${ENV_FILE}" ]]; then
  echo "Loading deploy environment from ${ENV_FILE}" >&2
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

if ! command_exists zip; then
  echo "zip is required for packaging" >&2
  exit 1
fi

ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query 'Account' --output text --region "${AWS_REGION}")}
LAYER_ARN=""
FUNCTION_ZIP=""
LAYER_ZIP=""

newline() { printf '\n'; }

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

package_layer() {
  if [[ "${SKIP_LAYER}" == "true" ]]; then
    echo "Skipping layer package (SKIP_LAYER=true)" >&2
    return
  fi

  local ts layer_zip
  ts=$(date +%Y%m%d-%H%M%S)
  layer_zip="${DIST_DIR}/${LAYER_NAME}-${ts}.zip"
  echo "Packaging shared layer to ${layer_zip}" >&2
  (cd "${LAYER_DIR}" && zip -r -q "${layer_zip}" python -x "*/__pycache__/*")
  LAYER_ZIP="${layer_zip}"
}

publish_layer() {
  if [[ "${SKIP_LAYER}" == "true" ]]; then
    LAYER_ARN=$(aws lambda list-layer-versions \
      --layer-name "${LAYER_NAME}" \
      --max-items 1 \
      --query 'LayerVersions[0].LayerVersionArn' \
      --output text \
      --region "${AWS_REGION}")
    echo "Reusing latest layer ${LAYER_ARN}" >&2
    return
  fi

  package_layer
  if [[ -z "${LAYER_ZIP}" ]]; then
    echo "Layer package missing" >&2
    exit 1
  fi

  local description version
  description="marketbrewer commerce layer $(timestamp)"
  version=$(aws lambda publish-layer-version \
    --layer-name "${LAYER_NAME}" \
    --description "${description}" \
    --zip-file "fileb://${LAYER_ZIP}" \
    --compatible-runtimes python3.12 \
    --compatible-architectures x86_64 \
    --query 'Version' \
    --output text \
    --region "${AWS_REGION}")

  LAYER_ARN="arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:layer:${LAYER_NAME}:${version}"
  echo "Published ${LAYER_ARN}" >&2
}

package_function() {
  local ts function_zip
  ts=$(date +%Y%m%d-%H%M%S)
  function_zip="${DIST_DIR}/babes-website-cart-quote-${ts}.zip"
  echo "Packaging Lambda to ${function_zip}" >&2
  (cd "${LAMBDA_DIR}" && zip -r -q "${function_zip}" . -x "*/__pycache__/*")
  FUNCTION_ZIP="${function_zip}"
}

update_function_layers() {
  if [[ -z "${LAYER_ARN}" ]]; then
    LAYER_ARN=$(aws lambda list-layer-versions \
      --layer-name "${LAYER_NAME}" \
      --max-items 1 \
      --query 'LayerVersions[0].LayerVersionArn' \
      --output text \
      --region "${AWS_REGION}")
    echo "Using existing layer ${LAYER_ARN}" >&2
  fi

  local layers=("${LAYER_ARN}")
  if [[ -n "${EXTRA_LAYER_ARNS}" ]]; then
    IFS=',' read -ra extra <<< "${EXTRA_LAYER_ARNS}"
    layers+=("${extra[@]}")
  fi

  echo "Updating ${LAMBDA_NAME} layers" >&2
  aws lambda update-function-configuration \
    --function-name "${LAMBDA_NAME}" \
    --layers "${layers[@]}" \
    --region "${AWS_REGION}" >/dev/null
}

update_function_code() {
  if [[ -z "${FUNCTION_ZIP}" ]]; then
    package_function
  fi

  echo "Updating ${LAMBDA_NAME} code" >&2
  aws lambda update-function-code \
    --function-name "${LAMBDA_NAME}" \
    --zip-file "fileb://${FUNCTION_ZIP}" \
    --region "${AWS_REGION}" >/dev/null
}

redeploy_api() {
  echo "Redeploying API Gateway ${REST_API_ID} (${STAGE_NAME})" >&2
  aws apigateway create-deployment \
    --rest-api-id "${REST_API_ID}" \
    --stage-name "${STAGE_NAME}" \
    --description "cart-quote deploy $(timestamp)" \
    --region "${AWS_REGION}" >/dev/null
}

smoke_test() {
  if [[ ! -f "${SAMPLE_PAYLOAD}" ]]; then
    cat <<'JSON' > "${SAMPLE_PAYLOAD}"
{
  "body": "{\"items\":[{\"sku\":\"SAMPLE\",\"quantity\":1,\"price\":10.0}],\"subtotal\":10.0,\"currency\":\"CAD\"}",
  "httpMethod": "POST",
  "headers": {"Content-Type": "application/json"},
  "isBase64Encoded": false
}
JSON
  fi

  echo "Invoking ${LAMBDA_NAME} with local payload" >&2
  aws lambda invoke \
    --function-name "${LAMBDA_NAME}" \
    --payload "fileb://${SAMPLE_PAYLOAD}" \
    --cli-binary-format raw-in-base64-out \
    --region "${AWS_REGION}" \
    "${DIST_DIR}/cart-quote-smoke-response.json" >/dev/null
  echo "Response stored in dist/cart-quote-smoke-response.json" >&2

  if command_exists curl; then
    echo "Hitting CloudFront https://${SITE_DOMAIN}/cart/quote" >&2
    curl -s -o /dev/null -w "%{http_code}\n" \
      -X POST "https://${SITE_DOMAIN}/cart/quote" \
      -H 'Content-Type: application/json' \
      --data '{"items":[{"sku":"SAMPLE","quantity":1,"price":10.0}],"subtotal":10.0,"currency":"CAD"}'
  fi
}

ensure_lambda_alarm() {
  local name="${ALARM_PREFIX}-lambda-errors"
  aws cloudwatch put-metric-alarm \
    --alarm-name "${name}" \
    --alarm-description "Cart quote Lambda errors >0 over 5 minutes" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --dimensions Name=FunctionName,Value="${LAMBDA_NAME}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 0 \
    --comparison-operator GreaterThanThreshold \
    --treat-missing-data notBreaching \
    ${ALARM_TOPIC_ARN:+--alarm-actions ${ALARM_TOPIC_ARN}} \
    --region "${AWS_REGION}" >/dev/null
  echo "Ensured alarm ${name}" >&2
}

enable_api_alarm() {
  local metric=$1 suffix=$2 threshold=$3
  local name="${ALARM_PREFIX}-api-${suffix}"
  aws cloudwatch put-metric-alarm \
    --alarm-name "${name}" \
    --alarm-description "Cart quote API ${metric} exceeds ${threshold}" \
    --metric-name "${metric}" \
    --namespace AWS/ApiGateway \
    --dimensions Name=ApiId,Value="${REST_API_ID}" Name=Stage,Value="${STAGE_NAME}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold "${threshold}" \
    --comparison-operator GreaterThanThreshold \
    --treat-missing-data notBreaching \
    ${ALARM_TOPIC_ARN:+--alarm-actions ${ALARM_TOPIC_ARN}} \
    --region "${AWS_REGION}" >/dev/null
  echo "Ensured alarm ${name}" >&2
}

ensure_alarms() {
  ensure_lambda_alarm
  enable_api_alarm "5XXError" "5xx" 5
  enable_api_alarm "4XXError" "4xx" 50
}

full_deploy() {
  publish_layer
  newline
  update_function_layers
  newline
  package_function
  update_function_code
  newline
  redeploy_api
  newline
  ensure_alarms
  newline
  smoke_test
}

usage() {
  cat <<EOF
Usage: ${0##*/} <command>

Commands:
  full        Publish layer (unless SKIP_LAYER=true), update Lambda, redeploy API, ensure alarms, smoke test
  layer       Package and publish the shared commerce layer
  function    Package and update the cart quote Lambda code
  layers-only Update Lambda layer reference without publishing
  api         Redeploy API Gateway stage only
  alarms      Ensure CloudWatch alarms exist
  smoke       Run Lambda invoke and optional CloudFront curl
  help        Show this message

Environment variables:
  AWS_REGION, LAMBDA_NAME, LAYER_NAME, REST_API_ID, STAGE_NAME,
  SITE_DOMAIN, ALARM_TOPIC_ARN, SKIP_LAYER, EXTRA_LAYER_ARNS,
  ENV_FILE (default config/deploy.cart-quote.env)
EOF
}

case "${1:-full}" in
  full) full_deploy ;;
  layer) publish_layer ;;
  function) package_function; update_function_code ;;
  layers-only) update_function_layers ;;
  api) redeploy_api ;;
  alarms) ensure_alarms ;;
  smoke) smoke_test ;;
  help|-h|--help) usage ;;
  *) usage; exit 1 ;;
esac
