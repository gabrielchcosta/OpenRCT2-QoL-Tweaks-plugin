# QoL and Tweaks

An OpenRCT2 plugin with a few small quality of life improvements for your gameplay

## Features

### Random shop colours

Automatically enables random merchandise colours for supported shops when they are built. Supported shops include information kiosks, balloon stalls, T-shirt stalls, hat stalls and souvenir stalls.

### Automatic no-entry signs

Automatically changes every newly placed path sign to a no-entry sign.

### Mouse click Price change multiplier

Didn't know what exactly to name this. Speeds up whenever you are clicking or scrolling to change the price of rides and some other windows which allow you to input numerical values.
This makes it so you can quickly click or scroll to change a ride from 1.00 to 2.00 for instance.

<img width="472" alt="price_change" src="https://github.com/user-attachments/assets/d1229a32-bd10-481d-ac63-77a3b022f5c2" />
<img width="472" height="305" alt="price_change" src="https://github.com/user-attachments/assets/e65c2301-e3f7-4ef4-afcb-a64130ce42a5" />


- The first five consecutive clicks change the price normally.
- The next five clicks change the value by 5x.
- Further consecutive clicks change it by 15x.

The multiplier follows the direction of the clicks and resets after a short pause or when the direction changes.
Basically go quickly for a big change in the ride value, take a short pause and click normally again for the normal +0.10 cents every click.

## Settings

<img width="496" height="228" alt="settings" src="https://github.com/user-attachments/assets/0131ad69-4323-497d-8bad-0f5462666eed" />

Open the **QoL and Tweaks Settings** item from the OpenRCT2 in-game menu. Each feature can be enabled or disabled separately.

## Installation

Copy `QoL_&_Tweaks.js` into your OpenRCT2 `plugin` directory, then restart OpenRCT2 or reload the plugins.
