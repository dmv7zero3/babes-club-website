# Shared Lambda Layers

Reusable code for MarketBrewer client Lambdas. Two domain-specific layers are provided:

- **marketbrewer-commerce-core** – Quote, checkout, and Stripe webhook helpers for commerce flows.
- **marketbrewer-forms-core** – Form submission, validation, email, and rate limiting utilities.

## Directory layout

```
shared_layers/
  commerce/
    python/shared_commerce/
      __init__.py
      constants.py
      env.py
      utils.py
      signing.py
      storage.py
      validation.py
      rate_limiting.py
  forms/
    python/shared_forms/
      __init__.py
      email_services.py
      email_templates.py
      storage.py
      utils.py
      validation.py
      rate_limiting.py
```

## Packaging instructions

Build each layer from the root of the repository:

```bash
LAYER_ROOT=AWS_Lambda_Functions/shared_layers

# Commerce layer
(cd "$LAYER_ROOT/commerce" && zip -r ../../dist/marketbrewer-commerce-core.zip python)

# Forms layer
(cd "$LAYER_ROOT/forms" && zip -r ../../dist/marketbrewer-forms-core.zip python)
```

Publish the resulting archives:

```bash
aws lambda publish-layer-version \
  --layer-name marketbrewer-commerce-core \
  --zip-file fileb://AWS_Lambda_Functions/dist/marketbrewer-commerce-core.zip \
  --compatible-runtimes python3.12

aws lambda publish-layer-version \
  --layer-name marketbrewer-forms-core \
  --zip-file fileb://AWS_Lambda_Functions/dist/marketbrewer-forms-core.zip \
  --compatible-runtimes python3.12
```

Attach the new layer versions to each Lambda:

```bash
aws lambda update-function-configuration \
  --function-name <function-name> \
  --layers arn:aws:lambda:us-east-1:<account>:layer:marketbrewer-commerce-core:<version>
```

Repeat for the forms layer where applicable. Remember that a Lambda can attach up to five layers in total.
