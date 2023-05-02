# fastapi
FROM python:3.10.4-alpine
ENV TZ=Asia/Bangkok
WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN apk add curl
RUN apk update && apk add gcc g++ unixodbc unixodbc-dev
RUN curl -O https://download.microsoft.com/download/e/4/e/e4e67866-dffd-428c-aac7-8d28ddafb39b/msodbcsql17_17.10.2.1-1_amd64.apk
RUN curl -O https://download.microsoft.com/download/e/4/e/e4e67866-dffd-428c-aac7-8d28ddafb39b/mssql-tools_17.10.1.1-1_amd64.apk
RUN apk add --allow-untrusted msodbcsql17_17.10.2.1-1_amd64.apk
RUN apk add --allow-untrusted mssql-tools_17.10.1.1-1_amd64.apk
RUN curl -O https://download.microsoft.com/download/b/9/f/b9f3cce4-3925-46d4-9f46-da08869c6486/msodbcsql18_18.1.1.1-1_amd64.apk
RUN curl -O https://download.microsoft.com/download/b/9/f/b9f3cce4-3925-46d4-9f46-da08869c6486/mssql-tools18_18.1.1.1-1_amd64.apk
RUN apk add --allow-untrusted msodbcsql18_18.1.1.1-1_amd64.apk
RUN apk add --allow-untrusted mssql-tools18_18.1.1.1-1_amd64.apk
RUN pip install --no-cache-dir -r /code/requirements.txt
COPY ./app /code/app
COPY ./main.py /code/main.py
# COPY ./.env /code/.env
COPY ./linkage1.json /code/linkage1.json
COPY ./linkage2.json /code/linkage2.json
CMD ["uvicorn", "main:app","--host","0.0.0.0","--port","8000","--reload"]