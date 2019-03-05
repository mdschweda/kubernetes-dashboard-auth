# Kubernetes Dashboard Authentication Proxy

![GitHub package.json version](https://img.shields.io/github/package-json/v/mdschweda/kubernetes-dashboard-auth.svg) ![GitHub](https://img.shields.io/github/license/mdschweda/kubernetes-dashboard-auth.svg) ![Codacy branch grade](https://img.shields.io/codacy/grade/cdda7e5eb60145e5a9640b248a797e77/master.svg)

An authentication proxy for the [Kubernetes dashboard](https://github.com/kubernetes/dashboard) that allows you to sign in with and control access levels of individual user accounts.

![](https://raw.githubusercontent.com/wiki/mdschweda/kubernetes-dashboard-auth/assets/login.png)

## TL;DR

1. Deploy Kubernetes dashboard: [Installation guide](https://github.com/kubernetes/dashboard/wiki/Installation).
   - *Optional*: [Set up a certificate](https://github.com/kubernetes/dashboard/wiki/Installation#recommended-setup).
2. [Configure](https://github.com/mdschweda/kubernetes-dashboard-auth/blob/master/deploy/config.yaml) authentication method.
   - *Optional*: Configure an [access control list](https://github.com/mdschweda/kubernetes-dashboard-auth/blob/master/deploy/acl.yaml) for access authorization.
3. [Deploy](https://github.com/mdschweda/kubernetes-dashboard-auth/blob/master/deploy/deployment.yaml) authentication proxy

## Documentation

For documentation and detailed installation instructions, visit the **[Wiki pages](https://github.com/mdschweda/kubernetes-dashboard-auth/wiki)**.

## License

[MIT license](https://github.com/mdschweda/kubernetes-dashboard-auth/blob/master/LICENSE)
