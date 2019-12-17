#!/bin/bash 
KDIR="../keys"
if [[ ! -d $KDIR ]]
then
	mkdir -p $KDIR
fi
openssl genrsa -out $KDIR/privkey.pem 2048
openssl req -batch -new -x509 -days 365  -subj '/CN=localhost/O=X-Snake/C=US' -key $KDIR/privkey.pem -out $KDIR/cert.pem

