#!/usr/bin/env bash
set -euo pipefail

# Provision S3 (private) + CloudFront for the CMAP Chat SPA using CloudFormation.
#
# Notes:
# - ACM cert MUST be in us-east-1 for CloudFront.
# - This stack does NOT create Route53 records automatically. We will create
#   alias records for simonscmap.ai and chat.simonscmap.ai pointing to the
#   CloudFront distribution domain name.
#
# Usage:
#   ./scripts/provision_s3_cloudfront.sh <STACK_NAME> <S3_BUCKET_NAME> <ACM_CERT_ARN> [APEX_DOMAIN] [ALT_DOMAIN]
#
# Example:
#   ./scripts/provision_s3_cloudfront.sh cmap-chat-prod simonscmap-ai-frontend arn:aws:acm:us-east-1:123:certificate/...

STACK_NAME="${1:-}"
BUCKET_NAME="${2:-}"
CERT_ARN="${3:-}"
APEX_DOMAIN="${4:-simonscmap.ai}"
ALT_DOMAIN="${5:-chat.simonscmap.ai}"

if [[ -z "$STACK_NAME" || -z "$BUCKET_NAME" || -z "$CERT_ARN" ]]; then
  echo "Usage: $0 <STACK_NAME> <S3_BUCKET_NAME> <ACM_CERT_ARN> [APEX_DOMAIN] [ALT_DOMAIN]"
  exit 1
fi

TEMPLATE="infra/cloudformation/s3-cloudfront-spa.yml"
if [[ ! -f "$TEMPLATE" ]]; then
  echo "Template not found: $TEMPLATE"
  exit 1
fi

echo "Deploying CloudFormation stack '$STACK_NAME' ..."
aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=cmap-chat \
    BucketName="$BUCKET_NAME" \
    AcmCertificateArn="$CERT_ARN" \
    ApexDomainName="$APEX_DOMAIN" \
    AlternateDomainName="$ALT_DOMAIN"

echo
echo "Stack deployed. Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' \
  --output table

echo
echo "Next steps:"
echo "1) In Route53 (hosted zone for $APEX_DOMAIN), create ALIAS A/AAAA records:"
echo "   - $APEX_DOMAIN  -> CloudFrontDomainName (output)"
echo "   - $ALT_DOMAIN   -> CloudFrontDomainName (output)"
echo "2) Build and deploy assets:"
echo "   npm install && npm run build"
echo "   ./scripts/deploy_s3_cloudfront.sh <BUCKET_NAME> <CLOUDFRONT_DISTRIBUTION_ID>"
