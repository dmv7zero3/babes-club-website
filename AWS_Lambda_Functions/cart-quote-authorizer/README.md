# Cart Quote Authorizer

Lambda authorizer that validates the `X-Api-Gateway-Key` header before `/cart/quote` requests reach the backend Lambda. Deploy alongside the cart quote API so only CloudFront traffic carrying the shared secret can invoke the API.

## Environment variables

| Name                | Required | Description                                                                                                                       |
| ------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `EXPECTED_API_KEY`  | ➖       | Hard-coded secret value to compare with the header. Prefer using the parameter option below for rotation.                         |
| `API_KEY_PARAMETER` | ➖       | SSM parameter (with decryption) that stores the shared secret. Use this instead of `EXPECTED_API_KEY` for production deployments. |

Exactly one of `EXPECTED_API_KEY` or `API_KEY_PARAMETER` must be defined. If both are present, `EXPECTED_API_KEY` takes precedence.

## Packaging

```bash
(cd AWS_Lambda_Functions/cart-quote-authorizer && zip -r ../../dist/cart-quote-authorizer.zip .)
```

Upload the archive and associate the function as a **REQUEST** Lambda authorizer in API Gateway. Configure the authorizer to read the `X-Api-Gateway-Key` header.
