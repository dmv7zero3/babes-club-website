<!-- Turn Off and On versioning control -->

aws s3api put-bucket-versioning \
 --bucket nash-and-smashed-website \
 --versioning-configuration Status=Enabled
