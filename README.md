# denso_deployment

- Edit .env file in fastapi-app/.env

  - PG_USER: username of the master postgresql database
  - PG_PASS: password of the master postgresql database
  - PG_SERVER: hostname or ipaddress of the master postgresql database
  - PG_PORT: port number of the master postgresql database
  - PG_DB: main database name
  - PG_NOTIFY_CHANNEL: a name of notify channel of postgresql
  - PG_TRIGGER_FUNC_NAME: a name of function to process when the trigger is called
  - PG_TRIGGER_NAME: a name of trigger when will be invoked when create or update record
  - X_API_KEY: a list of api key
  - LINKAGE1: linkage1 file name, linkage map between line id of main db and D-QiTs db
  - LINKAGE2: linkage2 file name, linkage map between line id of main db and baratsukiKPI db
  - USE_DOCKER: flag for define application is running by docker or not, 0 = not use, 1 = use

- Edit .env file in next-app/.env

  - NEXT_PUBLIC_API_URL: url to the API , it should be `http://{hostname or ip}/api`
  - NEXT_PUBLIC_API_KEY: an api key

- Build and run
  - `docker-compose build`
  - `docker-compose up -d` or `docker-compose up` (if need to see the log)
