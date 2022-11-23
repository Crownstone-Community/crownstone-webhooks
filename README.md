# crownstone-webhooks

Server to forward events to external urls.

# Documentation

[Documentation can be found here](./docs/README.md)

# Installation

To install the dependencies, run:

```
yarn
```

The following environmental variables are required:

```
// where does this server look for an event socket connection?
CROWNSTONE_CLOUD_SOCKET_ENDPOINT = https://my.crownstone.rocks

// token used to authenticate with the server above
CROWNSTONE_CLOUD_SSE_TOKEN = <CROWNSTONE_CLOUD_SSE_TOKEN>
```


```
// Admin token to allow managing of users. Used in REST api.
CROWNSTONE_USER_ADMIN_KEY = <CROWNSTONE_USER_ADMIN_KEY>
```

```
// Rate limiting per user (not oauth token, but user like Google etc)
DAILY_ALLOWANCE = 5000
```

```
// Name of database
MONGO_DB = <database name>
MONGO_URL = <connection url for mongo database>
```

# License

## Open-source license

This firmware is provided under a noncontagious open-source license towards the open-source community. It's available under three open-source licenses:
 
* License: LGPL v3+, Apache, MIT

<p align="center">
  <a href="http://www.gnu.org/licenses/lgpl-3.0">
    <img src="https://img.shields.io/badge/License-LGPL%20v3-blue.svg" alt="License: LGPL v3" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
  </a>
  <a href="https://opensource.org/licenses/Apache-2.0">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License: Apache 2.0" />
  </a>
</p>

## Commercial license

This firmware can also be provided under a commercial license. If you are not an open-source developer or are not planning to release adaptations to the code under one or multiple of the mentioned licenses, contact us to obtain a commercial license.

* License: Crownstone commercial license

# Contact

For any question contact us at <https://crownstone.rocks/contact/> or on our discord server through <https://crownstone.rocks/forum/>.
