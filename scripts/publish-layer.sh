#!/usr/bin/env bash
set -euo pipefail

# Publish a Lambda layer from `AWS_Lambda_Functions/shared_layers/commerce/python`.
# Usage:
#   scripts/publish-layer.sh [--name NAME] [--dir PATH] [--runtime RUNTIME] [--region REGION] [--attach FUNCTION_NAME]
# Examples:
#   scripts/publish-layer.sh
#   scripts/publish-layer.sh --name babesclub-shared-commerce --attach babes-website-auth-login

LAYER_NAME="babesclub-shared-commerce"
LAYER_DIR="AWS_Lambda_Functions/shared_layers/commerce/python"
RUNTIME="python3.12"
REGION="us-east-1"
ZIP_PATH="/tmp/${LAYER_NAME}-layer.zip"
ATTACH_FUNCTION=""
DESCRIPTION="Shared commerce helpers for babes club"

print_usage() {
  sed -n '1,120p' <<'USAGE'
Usage: publish-layer.sh [options]

Options:
  --name NAME          Layer name (default: babesclub-shared-commerce)
  --dir PATH           Directory that contains the top-level `python/` folder (default: AWS_Lambda_Functions/shared_layers/commerce/python)
  --runtime RUNTIME    Compatible runtime (default: python3.12)
  --region REGION      AWS region (default: us-east-1)
  --attach FUNCTION    Attach published layer to a Lambda function by name
  -h, --help           Show this help
USAGE
}

while [[ ${#@} -gt 0 ]]; do
  case "$1" in
    --name) LAYER_NAME="$2"; shift 2;;
    --dir) LAYER_DIR="$2"; shift 2;;
    --runtime) RUNTIME="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    --attach) ATTACH_FUNCTION="$2"; shift 2;;
    -h|--help) print_usage; exit 0;;
    *) echo "Unknown arg: $1"; print_usage; exit 1;;
  esac
done

if [[ ! -d "$LAYER_DIR" ]]; then
  echo "Layer directory not found: $LAYER_DIR" >&2
  exit 2
fi

echo "Packaging layer from: $LAYER_DIR"
rm -f "$ZIP_PATH"

# Ensure the zip contains a top-level 'python/' folder, as required by Lambda layers.
LAYER_PARENT_DIR=$(dirname "$LAYER_DIR")
LAYER_BASENAME=$(basename "$LAYER_DIR")

pushd "$LAYER_PARENT_DIR" >/dev/null
zip -r "$ZIP_PATH" "$LAYER_BASENAME" -x "*.pyc" "__pycache__/*" >/dev/null
popd >/dev/null

echo "Created zip: $ZIP_PATH (size: $(du -h "$ZIP_PATH" | cut -f1))"

echo "Publishing layer '$LAYER_NAME' to region $REGION (runtime: $RUNTIME)"
PUBLISH_OUT=$(aws lambda publish-layer-version \
  --layer-name "$LAYER_NAME" \
  --description "$DESCRIPTION" \
  --zip-file fileb://"$ZIP_PATH" \
  --compatible-runtimes "$RUNTIME" \
  --region "$REGION" 2>&1)

if [[ $? -ne 0 ]]; then
  echo "Failed to publish layer:" >&2
  echo "$PUBLISH_OUT" >&2
  exit 3
fi

# Extract LayerVersionArn from output
LAYER_ARN=$(echo "$PUBLISH_OUT" | awk -F '"' '/LayerVersionArn/ {print $4; exit}')
if [[ -z "$LAYER_ARN" ]]; then
  echo "Could not determine LayerVersionArn from publish output:" >&2
  echo "$PUBLISH_OUT" >&2
  exit 4
fi

echo "Published layer: $LAYER_ARN"

if [[ -n "$ATTACH_FUNCTION" ]]; then
  echo "Attaching layer to function: $ATTACH_FUNCTION"
  # Get existing layers, preserve them and add the new one.
  EXISTING=$(aws lambda get-function-configuration --function-name "$ATTACH_FUNCTION" --query 'Layers[].Arn' --output text --region "$REGION" || true)
  # Build JSON array of ARNs (if none, just the new arn)
  if [[ -z "$EXISTING" ]]; then
    NEW_LAYERS_JSON="[\"$LAYER_ARN\"]"
  else
    # Convert space-separated list into JSON array while avoiding duplicates
    IFS=$'\n' read -r -a arr <<<"$(echo "$EXISTING")"
    NEW_LAYERS_JSON='['
    for a in "${arr[@]}"; do
      if [[ "$a" != "$LAYER_ARN" ]]; then
        NEW_LAYERS_JSON+="\"$a\"," 
      fi
    done
    NEW_LAYERS_JSON+="\"$LAYER_ARN\"]"
  fi
  aws lambda update-function-configuration --function-name "$ATTACH_FUNCTION" --layers "$LAYER_ARN" --region "$REGION" >/dev/null
  echo "Requested function update; it may take a few seconds to become active."
fi

echo "Done. Layer ARN: $LAYER_ARN"

exit 0
