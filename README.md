# NGFK Development - Administration

## Manual setup

### Google Cloud Platform

Most of the Google Cloud Platform infrastructure is deployed using Terraform. To get Terraform to work properly from GitHub Actions these steps were taken.

1. Create GCP project
   - Project ID: `ngfk-administration`
1. Add a bucket for Terraform's state
   - Bucket name: `ngfk-administration-tf-state`
   - Location type: `Region`
   - Location: `europe-west4`
1. Create a service-account for GitHub Actions
   - Account name: `GitHub Actions`
   - Account ID: `github-actions`
   - Email: `github-actions@ngfk-administration.iam.gserviceaccount.com`
   - Role: `Owner`
1. Setup Workload Identity Federation (WIF)
   - Pool name: `GitHub`
   - Pool ID: `github`
   - Provider: `OpenID Connect (OIDC)`
   - Provider name: `GitHub Actions`
   - Provider ID: `github-actions`
   - Issuer: `https://token.actions.githubusercontent.com`
   - Attribute `google.subject`: `assertion.sub`
   - Attribute `attribute.repository`: `assertion.repository`
1. Grant service-account access to WIF
   - Filter: `repository` = `ngfk-development/ngfk-administration`
1. Allow service-account to read/write docker containers to the registry project
   - Registry: `https://console.cloud.google.com/artifacts/browse/ngfk-registry`
   - Service-account: `github-actions@ngfk-administration.iam.gserviceaccount.com`
   - Permissions: `Artifact Registry Reader` and `Artifact Registry Writer`
