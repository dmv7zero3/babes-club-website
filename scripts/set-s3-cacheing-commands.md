# Fix JavaScript files (1-year cache)

aws s3 cp s3://moon-lounge-webapp/js/ s3://moon-lounge-webapp/js/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --content-type "application/javascript" \
 --exclude "_.map" \
 --exclude "_.LICENSE.txt"

# Fix JavaScript source maps

aws s3 cp s3://moon-lounge-webapp/js/ s3://moon-lounge-webapp/js/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --content-type "application/json" \
 --include "\*.map"

# Fix CSS files (1-year cache)

aws s3 cp s3://moon-lounge-webapp/styles/ s3://moon-lounge-webapp/styles/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --content-type "text/css"

# Fix font files (1-year cache)

aws s3 cp s3://moon-lounge-webapp/fonts/ s3://moon-lounge-webapp/fonts/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable"

# Fix image files (1-year cache)

aws s3 cp s3://moon-lounge-webapp/images/ s3://moon-lounge-webapp/images/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --exclude "\*.hash"

# Fix AVIF images (1-year cache, correct content-type)

aws s3 cp s3://moon-lounge-webapp/images/ s3://moon-lounge-webapp/images/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --content-type "image/avif" \
 --include "_.avif" \
 --exclude "_.hash"

# Fix WebP images (1-year cache, correct content-type)

aws s3 cp s3://moon-lounge-webapp/images/ s3://moon-lounge-webapp/images/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --content-type "image/webp" \
 --include "_.webp" \
 --exclude "_.hash"

# Fix optimized JPEG images (1-year cache, correct content-type)

aws s3 cp s3://moon-lounge-webapp/images/ s3://moon-lounge-webapp/images/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --content-type "image/jpeg" \
 --include "_-optimized.jpg" \
 --include "_-optimized.jpeg" \
 --exclude "\*.hash"

# Fix optimized PNG images (1-year cache, correct content-type)

aws s3 cp s3://moon-lounge-webapp/images/ s3://moon-lounge-webapp/images/ \
 --recursive \
 --metadata-directive REPLACE \
 --cache-control "public, max-age=31536000, immutable" \
 --content-type "image/png" \
 --include "_-optimized.png" \
 --exclude "_.hash"
