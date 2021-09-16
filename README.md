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

