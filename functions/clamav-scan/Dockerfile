# ========================================
# Builder Image
# ========================================
FROM --platform=linux/x86_64 public.ecr.aws/lambda/nodejs:20 as builder

COPY package.json package-lock.json index.ts  ./

#
# 1) install dependencies with dev dependencies
# 2) build the project
# 3) remove dev dependencies
# 4) install dependencies without dev dependencies
#
RUN npm install && \
    npm run build && \
    rm -rf node_modules && \
    npm install --omit=dev

# ========================================
# Runtime Image
# ========================================
FROM --platform=linux/x86_64 public.ecr.aws/lambda/nodejs:20 as runtime

ENV CLAMAV_PKG=clamav-1.2.1.linux.x86_64.rpm
RUN <<-EOF
    set -ex

    #
    # install glibc-langpack-en to support english language and utf-8
    # this was required by clamscan to avoid error "WARNING: Failed to set locale"
    #
    dnf install wget glibc-langpack-en -y

    # 
    # 1) download latest ClamAV from https://www.clamav.net/downloads
    # 2) install using `rpm` and it requires full path for local packages
    # 3) remove the downloaded package and clean up for smaller runtime image
    # 
    wget https://www.clamav.net/downloads/production/${CLAMAV_PKG}
    rpm -ivh "${LAMBDA_TASK_ROOT}/${CLAMAV_PKG}"
    rm -rf ${CLAMAV_PKG}
    dnf remove wget -y
    dnf clean all

    #
    # the current working directory is "/var/task" as defined in the base image:
    # https://github.com/aws/aws-lambda-base-images/blob/nodejs20.x/Dockerfile.nodejs20.x
    #
    # 1) "lib/database" is the path to download the virus database
    # 2) "freshclam.download.log" and "freshclam.conf.log" are the log files for freshclam CLI
    #
    mkdir -p ${LAMBDA_TASK_ROOT}/lib/database
    touch ${LAMBDA_TASK_ROOT}/lib/{freshclam.download.log,freshclam.conf.log}
    chmod -R 777 ${LAMBDA_TASK_ROOT}/lib

    #
    # default configuration path for freshclam is "/usr/local/etc/freshclam.conf"
    # we create a symbolic link to the default configuration path and copy our custom config file
    #
    ln -s /usr/local/etc/freshclam.conf ${LAMBDA_TASK_ROOT}/lib/freshclam.conf
EOF

COPY freshclam.conf /var/task/lib/freshclam.conf

#
# freshclam CLI is a virus database update tool for ClamAV, documentation:
# https://linux.die.net/man/1/freshclam
#
RUN <<-EOF
    set -ex
    export LOG_FILE_PATH="${LAMBDA_TASK_ROOT}/lib/freshclam.conf.log"

    freshclam --verbose --stdout --user root \
        --log=${LOG_FILE_PATH} \
        --datadir=${LAMBDA_TASK_ROOT}/lib/database

    if grep -q "Can't download daily.cvd\|Can't download main.cvd\|Can't download bytecode.cvd" ${LOG_FILE_PATH}; then
        echo "ERROR: Unable to download ClamAV database files - your request may be being rate limited"
        exit 1;
    fi
EOF

#
# copy application files from the builder image
# 
COPY --from=builder /var/task/dist/* /var/task/
COPY --from=builder /var/task/node_modules /var/task/node_modules

CMD [ "index.handler" ]