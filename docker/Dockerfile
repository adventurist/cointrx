FROM ubuntu:16.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt update
RUN apt install -y gnupg curl git
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt install -y nodejs
RUN npm install -g n
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - 
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update
RUN apt install -y yarn
RUN apt install -y python-pip
RUN apt install -y python3-pip

USER root
WORKDIR /var/www

RUN git clone https://git.logicp.ca/logicp/coinx.git coinx
WORKDIR /var/www/coinx
RUN apt-get install -y locales libpq-dev
RUN locale-gen en_US.UTF-8
RUN update-locale en_US.UTF-8
RUN export LC_ALL=$(locale -a | grep en_US)
RUN export LANG=$(locale -a | grep en_US)
ENV LANG C.UTF-8
RUN pip3 install --upgrade setuptools
RUN pip3 install -r requirements.install
ENV TRX_ENV LOCAL_DEVELOPMENT
EXPOSE 6969
EXPOSE 9977
EXPOSE 9696

