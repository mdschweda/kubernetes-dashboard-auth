# Kubernetes Dashboard Authentication Proxy

An authentication proxy for the [Kubernetes dashboard](https://github.com/kubernetes/dashboard) that allows you to login with individual user accounts.

## Installation

1. Run Kubernetes Dashboard on your Cluster: [Installation guide](https://github.com/kubernetes/dashboard/wiki/Installation).
2. Make sure that you have configured a [certificate](https://github.com/kubernetes/dashboard/wiki/Installation#recommended-setup) for your Kubernetes Dashboard (`kubernetes-dashboard-certs` Secret).
3. Configure the authentication proxy.
