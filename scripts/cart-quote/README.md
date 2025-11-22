# Cart Quote Deployment Helper

`scripts/cart-quote/deploy.sh` automates the repetitive AWS CLI steps needed to ship the cart quote Lambda, shared commerce layer, and supporting API Gateway stage.

## Quick start

```bash
cp config/deploy.cart-quote.env.example config/deploy.cart-quote.env
# Edit the file with your environment values, SNS topic ARN, and optional flags

scripts/cart-quote/deploy.sh full
```

Available commands:

| Command       | Purpose                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `full`        | Publish (or reuse) the shared layer, update the Lambda code/layers, redeploy the API, ensure CloudWatch alarms, and run a smoke test. |
| `layer`       | Package and publish only the shared commerce layer.                                                                                   |
| `function`    | Package and update only the cart quote Lambda code.                                                                                   |
| `layers-only` | Refresh the Lambda's layer attachments without publishing a new version.                                                              |
| `api`         | Trigger an API Gateway deployment for the configured stage.                                                                           |
| `alarms`      | Create or update CloudWatch alarms for Lambda errors and API 4XX/5XX rates.                                                           |
| `smoke`       | Invoke the Lambda locally via AWS CLI and (optionally) curl the CloudFront endpoint.                                                  |

Set `ALARM_TOPIC_ARN` in `config/deploy.cart-quote.env` to wire alarms into your alerting channel. Use `SKIP_LAYER=true` if you only need to refresh the Lambda code while reusing the latest published layer.
