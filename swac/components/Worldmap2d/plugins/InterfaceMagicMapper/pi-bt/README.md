# Pi
## Install
To set up a new pi, do the following steps:
- copy the `pi-bt` folder to the pi `scp -r pi-bt/ pi@{hostname/ip}:~/pi-bt`
- login into the pi `ssh pi@{hostname/ip}`
- go to the pi folder `cd pi-bt`
- check if node is installed with `node -v`
  - if node is not installed, install node version manager with `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash`
  - after that run `nvm install --lts`
  - check if installtion was successful with `node -v`
- run `npm i`

### How to setup up self-signed certificate
- On pi `cd pi-bt`
- run `openssl genrsa -out key.pem`
- run `openssl req -new -key key.pem -out csr.pem`
- run `openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem`
- run `rm csr.pem`
- reboot pi `sudo reboot`
- after reboot run `node index.js` to test server

## Start script on boot
To start the script on boot, do the following steps:
- install pm2 with `npm i -g pm2`
- go to the pi folder `cd pi-bt`
- run `pm2 start index.js` 
- run `pm2 startup systemd`
- this genearate a command like this:
```bash
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
```
- copy the generated command and run it
- run `pm2 save` to save the current state of the script
- run `pm2 list` to check if the script is running
- for more information you can run `pm2 show index`
- run `sudo reboot` to reboot the pi


