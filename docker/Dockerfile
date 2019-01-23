FROM ubuntu:16.04

ARG DEBIAN_FRONTEND=noninteractive
RUN apt update &&\
	apt install -y gnupg curl git software-properties-common nodejs vim &&\
	add-apt-repository --yes ppa:bitcoin/bitcoin &&\
	curl -sL https://deb.nodesource.com/setup_10.x | bash - &&\
	curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -\
	echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list &&\
	apt update && apt install -y yarn python-pip bitcoind &&\
	apt install -y python3-pip locales libpq-dev

USER root
WORKDIR /var/www
RUN git clone https://git.logicp.ca/logicp/coinx.git coinx

WORKDIR /var/www/coinx
ENV LANG C.UTF-8
ENV TRX_ENV LOCAL_DEVELOPMENT
RUN locale-gen en_US.UTF-8 && update-locale en_US.UTF-8 &&\
	export LC_ALL=$(locale -a | grep en_US) && export LANG=$(locale -a | grep en_US) &&\
	pip3 install --upgrade setuptools && pip3 install -r requirements.install
EXPOSE 6969
EXPOSE 9977
EXPOSE 9696
EXPOSE 18444/tcp
EXPOSE 18443/tcp
COPY users.json /var/www/coinx/bot/users.json
COPY bitcoin/bitcoin.conf ~/.bitcoin/bitcoin.conf

