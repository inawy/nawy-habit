Nawy Habit (عادة) - Google soft tints, noon on a 3x3 grid, no gaps
Squares touching (no gap), sharp corners. Noon = dot (hero) + 5 lit squares; 3 ghost squares (left/right/below the dot) at 14% blue.
Colours: dot #3D7BFF (Nawy blue) | Google tints (Material 100): red #FAD2CF (left, base-right) | yellow #FEEFC3 (right) | blue #D2E3FC (base-left) | green #CEEAD6 (base-middle) | tile #111318
Source of tints: Google palette values (Chromium cros_palette / Android docs): blue-100 #d2e3fc, red-100 #fad2cf, yellow-100 #feefc3, green-100 #ceead6
Golden ratio (T=512): mark width = T/phi = 316.4 (cell 105.5) | tile radius = T/phi^3 = 120.9 | margins top:bottom = 1:phi
Optical sizing: <=48px uses a larger mark (0.80T) without ghost squares.
Maskable / round icons use a smaller centred mark to stay inside the safe zone.
Monochrome / badge: solid white cells, no ghost squares.
ios/: square opaque PNGs + tinted 1024 | android/: adaptive fg 432 (bg #111318), monochrome 432, legacy + round, playstore-512
web/: favicon.ico/svg/png, apple-touch, PWA icons (any + maskable), manifest-icons.json | notification/: white badges | svg/: masters
