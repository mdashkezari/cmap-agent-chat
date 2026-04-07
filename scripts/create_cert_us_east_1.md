# ACM certificate for CloudFront (important)

CloudFront requires the ACM certificate to be in **us-east-1**.

Steps (typical):
1) Open ACM in us-east-1
2) Request certificate for:
   - simonscmap.ai
   - chat.simonscmap.ai
3) Validate via DNS (Route 53 recommended)
4) Use the certificate ARN as a parameter when creating the CloudFront distribution.

This repo's CloudFormation template expects us to supply:
- `AcmCertificateArn`
