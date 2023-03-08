---
title: "Setup guest and IOT VLAN with UniFi and a EdgeRouter"
slug: "unifi-edgerouter-guest-iot-vlan"
date: 2020-02-28T21:13:56+01:00
lastmod: 2020-10-10T14:20:19+02:00
author: "Fredrik Jonsson"
tags: ["wi-fi","network","popular"]
description: "Setup a advanced home network including guest and IOT VLAN with UniFi and a EdgeRouter"
---

My goal is to have separate wireless networks for guest and IOT devices, each on there own VLAN. Setting up VLAN with an EdgeRouter, UniFi switch and UniFI access points takes a few extra steps. In this post I describe how I got it working.

A year and a half ago I posted [Cover my house with UniFi Wi-Fi]({{< relref "cover-my-house-with-unifi-wifi.md" >}}). The system has been running well since then. Recently I replaced the old AirPort router with an EdgeRouter X.

The [EdgeRouter X](https://www.ui.com/edgemax/edgerouter-x/) is small, cheep and surprisingly capable. I'm not too fond of the EdgeOS admin interface, but it gets the job done.

Getting the UniFi Security Gateway is an option but it's less flexible, more expensive and can not route 1 Gbit/s. It's easier to set up since everything can be done in the UniFi interface.

*Update 2020-04-06*: Added a section about setting up needed DNS forwarding to VLANs on the EdgeRouter. A reader was kind enough to alert me that this was a missing step. I had it configured myself but missed to add it to the blog post.

*Update 2020-04-16*: Another kind reader pointed out the need to set "Router" in the EdgeRouter DHCP configuration. As above I had this configured myself but it was not in the blog post, fixed now.

*Update 2020-09-23*: Added instructions for UniFi Controller version 6.x.

*Update 2020-10-10*: Added instructions to enable mDNS reflector on the EdgeRouter. Needed so devices using Bonjour/multicast DNS can be discovered.


## Initial setup of EdgeRouter

I recommend to use the wizard to get a good start, I picked the "Basic setup". For WAN I used eth4 and then checked "Only use one LAN" so eth0, eth1, eth2 and eth3 becomes a LAN switch. The group of ports is named "switch0" by the system.

In the "LAN ports" section I entered the IP address space I wanted to use on the LAN and  made sure the DHCP server was activated.

If you have not already created a new user, make sure to do so at the bottom of the wizard. Never run with the default user and password in production.

After clicking "Apply" I then had a working router and could connect to the Internet.

The wizard sets up a Local network, a LAN DHCP server, sensible WAN firewall rules etc.

For basic usages you are done by this point.


## Make the EdgeRouter X route 1 Gbit/s

The EdgeRouter X can by default only route around 300 Mbit/s. If you don't need QoS you can enable [hardware offloading](https://help.ubnt.com/hc/en-us/articles/115006567467-EdgeRouter-Hardware-Offloading) and get it to route 1 Gbit/s.

This needs to be done on the command line. You can use the "CLI" button in the top right on the EdgeOS admin interface or login to the router via SSH.

~~~~
$ configure
$ set system offload hwnat enable
$ commit; save
$ exit
~~~~


## Move guests and IOT devices to separate VLAN

With virtual LAN (VLAN) you can have multiple separate networks over one set of cables. Perfect for separating guests and IOT stuff from you personal devices (computers, phones etc.)

The two VLAN will need to be set up on both the EdgeRouter and in UniFi, make sure you use the same VLAN ID in both places.

Here are the values I picked for my VLAN.

Name |VLAN ID|Network
:----|:----|:----
Guest|10|10.10.10.1/24
IOT|20|10.10.20.1/24

VLAN ID can be 2-4094 (I believe "1" is the main LAN).

I like to use easily distinguishable addresses for each LAN/VLAN, then it's quick and easy to confirm where a device is connected.


### Set up your VLAN on the EdgeRouter

On the main dashboard there is a "Add interface" button. Use this to create the needed VLAN.

1. Enter 10 for VLAN ID.
2. For interface select "switch0".
3. Add "Guest" for description.
3. For address select "Manually define IP address". Enter the IP address "10.10.10.1/24". The router are always assigned the "1" address by custom.
4. Click "Save".

Redo all the steps for the IOT VLAN, using the IOT values for VLAN etc.

You will now have two new interfaces named "switch0.10" and "switch0.20".


### Create a DHCP server for each VLAN on the EdgeRouter

Each VLAN now needs a DHCP server so devices on it can get IP addresses.

Go to the "Services" tab. Click the "Add DHCP Server" button.

1. For name enter "Guest"
2. Set subnet to "10.10.10.0/24". Yes, a zero before the "/24". Above we entered an address, here we specify an subnet (range of addresses).
3. Range start can be set to "2" and range stop to "254".
4. Set Router to the IP of the interface "10.10.10.1".
5. Set DNS 1 to the IP of the interface "10.10.10.1".
6. Click "Save".

Again, redo all the steps for the IOT DHCP server, using the IOT values for subnet etc.


### DNS forwarding to VLANs on the EdgeRouter

The DNS server on the EdgeRouter need to know that it should listen on the new VLAN interfaces.

Go to the "Services" tab and then the "DNS" sub tab. In the "DNS Forwarding" section add two listen interfaces for "switch0.10" and "switch0.20".

While here I suggest you up the cache size so more queries are cached. I opted to set it to "500".

### VLAN firewall rules on the EdgeRouter

These are only needed if you like me want to limit what Guest and IOT connected devices can do.

I decided to block all access from Guest and IOT to the EdgeRouter itself (local) except for DNS and DHCP services.

Guest and IOT devices should not be able to connect to each other. Devices on LAN should be able to access guest and IOT devices, but not the other way around.

For this I created a network group, "RFC1918 ranges", with all the private IP ranges.

Here is a quick summary of the rules:

GUEST_IN:

* default accepts
* interfaces switch0.10/in, switch0.20/in
* rules Allow established/related, Drop invalid, Block local access (RFC1918)

GUEST_LOCAL:

* default drop
* interfaces switch0.10/local, switch0.20/local
* rules Allow established/related, Drop invalid, Allow DNS (port 53), Allow DHCP (port 67)

See detailed firewall rules and groups configuration at the end of this post.


### Set up your VLAN in UniFi

Now we need to set up the same VLAN in UniFi as we did above in the EdgeRouter. Instructions below for both version 5.x and 6.x of the UniFi Controller.


#### Controller version 6.x

Go to "Settings -> Advanced Features".

1. In the "Network Isolation" section click the "Add Network Isolation" button.
2. Enter the name "Guest"
3. Enter VLAN ID 10
4. Click "Apply Changes".

And as before, redo all the steps for the IOT VLAN, using the IOT values for VLAN etc.


#### Controller version 5.x

Go to "Settings -> Networks -> Local Networks". You most likely only have one network named "LAN" listed here.


1. In the bottom right there is a big blue button "Create New Local Network".
2. You get an option of standard or advanced. Pick advanced, it will be easier, go figure.
3. Enter the name "Guest"
4. Go to "Network Purpose" and pick "VLAN only", most of the options will now disappear. 
5. Enter VLAN ID 10
6. Click "Done".

And as before, redo all the steps for the IOT VLAN, using the IOT values for VLAN etc.


### Create separate guest and IOT wireless networks in UniFi

At last, time to set up the actual wireless networks for Guest and IOT. Instructions below for both version 5.x and 6.x of the UniFi Controller.


#### Controller version 6.x

Go to "Settings -> WiFi".

1. In the "WiFi" section click the "Add New WiFi Network" button.
2. Enter the name "Guest"
3. Enter a good password for the new wireless network.
4. For network select "Guest".
5. Click "Apply Changes".

Again, redo all the steps for the IOT network, using the IOT values for VLAN etc.

There are a lot of possible option for wireless networks in UniFi but they are out of scope for this guide.


#### Controller version 5.x

Go to "Settings -> WI-FI -> Wi-Fi Networks". You most likely only have one network setup here.

1. In the bottom right there is a big blue button "Create New Wi-Fi Network".
2. You get an option of standard or advanced, pick advanced.
3. Enter the name "Guest"
4. Enter a good password for the new wireless network.
5. Check "Use VLAN" and enter VLAN ID 10
4. Click "Done".

Again, redo all the steps for the IOT network, using the IOT values for VLAN etc.

There are a lot of possible option for wireless networks in UniFi but they are out of scope for this guide.


## Enable mDNS reflector on the EdgeRouter

A lot of devices uses Bonjour/multicast DNS to be easily discoverable on the network. By default this traffic can not pass between different networks/VLAN on the EdgeRouter. For it to work we need to enable the mDNS reflector.

Go to the "Config Tree" tab. In the left column there is a long list of configurations options.

Open up "Services" and below that "mdns" by clicking the small triangle in front of the options.

Below "mdns" you have two entries, click the "+" after "reflector". It will turn red to indicate the selection. Now click the "Preview" button at the bottom, and in the dialog that opens up click "Apply".

Not the most logical path but you have now enabled the mDNS reflector.

I do not know if this raises any security concerns. But the option would be to have the devices on the main network and that is defiantly worse. IOT devices have notoriously bad security.


## Conclusion

Test to connect to the three different wireless networks in turn. Confirm that you get an IP address is the correct range for each network and that you can reach the internet.

If you like me added firewall rules, test that they are working.

With this in place I feel less worried about giving out guest access and adding IOT devices to my network.


## Detailed firewall rules and groups

These are copied from the json config file directly so all the details are there. But please do the configuration via the GUI, editing json files it not a task for humans.

~~~~ json
group {
    network-group RFC1918 {
        description "RFC1918 ranges"
        network 10.0.0.0/8
        network 172.16.0.0/12
        network 192.168.0.0/16
    }
}
~~~~


~~~~ json
name GUEST_LOCAL {
    default-action drop
    description ""
    rule 1 {
        action accept
        description "Allow established/related"
        log disable
        protocol all
        state {
            established enable
            invalid disable
            new disable
            related enable
        }
    }
    rule 2 {
        action drop
        description "Drop invalid state"
        log disable
        protocol all
        state {
            established disable
            invalid enable
            new disable
            related disable
        }
    }
    rule 3 {
        action accept
        description "Allow DNS"
        destination {
            port 53
        }
        log disable
        protocol tcp_udp
    }
    rule 4 {
        action accept
        description "Allow DHCP"
        destination {
            port 67
        }
        log disable
        protocol udp
    }
}
~~~~

~~~~ json
name GUEST_IN {
    default-action accept
    description ""
    rule 10 {
        action accept
        description "Allow established/related"
        log disable
        protocol all
        state {
            established enable
            invalid disable
            new disable
            related enable
        }
    }
    rule 20 {
        action drop
        description "Drop invalid state"
        log disable
        protocol all
        state {
            established disable
            invalid enable
            new disable
            related disable
        }
    }
    rule 30 {
        action drop
        description "Block local access"
        destination {
            group {
                network-group RFC1918
            }
        }
        log disable
        protocol all
    }
}
~~~~

{{< sponsor >}}


## Useful resources

* [Crosstalk Solutions - Secure IoT Network Configuration - YouTube](https://www.youtube.com/watch?v=6ElI8QeYbZQ)
* [Crosstalk Solutions - DNS Server Lockdown - YouTube](https://www.youtube.com/watch?v=j6IzYGAI7IE)

