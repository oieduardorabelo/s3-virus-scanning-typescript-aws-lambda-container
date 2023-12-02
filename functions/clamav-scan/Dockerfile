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

#
# 1) Download latest ClamAV from https://www.clamav.net/downloads
# 2) Install using `rpm` and it requires full path for local packages
# 3) Remove the downloaded package and clean up for smaller runtime image
#
ENV CLAMAV_PKG=clamav-1.2.1.linux.x86_64.rpm
RUN set -ex && \
    dnf install wget -y && \
    wget https://www.clamav.net/downloads/production/${CLAMAV_PKG} && \
    rpm -ivh "${LAMBDA_TASK_ROOT}/${CLAMAV_PKG}" && \
    rm -rf ${CLAMAV_PKG} && \
    dnf remove wget -y && \
    dnf clean all

#
# install glibc-langpack-en to support english language and utf-8
# this was required by clamscan to avoid error "WARNING: Failed to set locale"
#
RUN dnf install glibc-langpack-en -y

#
# the current working directory is "/var/task" as defined in the base image:
# https://github.com/aws/aws-lambda-base-images/blob/nodejs20.x/Dockerfile.nodejs20.x
#
# 1) "lib/database" is the path to download the virus database
# 2) "freshclam.download.log" and "freshclam.conf.log" are the log files for freshclam CLI
#
RUN mkdir -p /var/task/lib/database
RUN touch /var/task/lib/{freshclam.download.log,freshclam.conf.log}
RUN chmod -R 777 /var/task/lib

#
# default configuration path for freshclam is "/usr/local/etc/freshclam.conf"
# we create a symbolic link to the default configuration path and copy our custom configuration file
#
RUN ln -s /usr/local/etc/freshclam.conf /var/task/lib/freshclam.conf
COPY freshclam.conf /var/task/lib/freshclam.conf

#
# freshclam CLI is a virus database update tool for ClamAV, documentation:
# https://linux.die.net/man/1/freshclam
#
RUN freshclam --verbose --stdout --user root --log=/var/task/lib/freshclam.download.log --datadir=/var/task/lib/database

#
# copy application files from the builder image
# 
COPY --from=builder /var/task/dist/* /var/task/
COPY --from=builder /var/task/node_modules /var/task/node_modules

CMD [ "index.handler" ]