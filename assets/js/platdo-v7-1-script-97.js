window.PlatdoReleaseData.unshift({
  "id": "v32-touch-controls",
  "version": 32,
  "date": "2026-11-15",
  "major": true,
  "title": "New mobile controls for City and Drive",
  "thumbnail": "assets/images/0c144134bd75ee9ad1b2.png",
  "thumbnailAlt": "Platdo City with the new mobile steering and pedal controls",
  "summary": "Animated car pedals, distinct bike controls and a stretching walk/run joystick, with safe gun/fist switching and clearer action feedback.",
  "sections": [
    {
      "title": "Cars in City and Drive",
      "items": [
        "Rebuilt the shared car touch HUD around left-side rounded steering arrows, two right-side pedals and a handbrake above the accelerator.",
        "Pedal artwork compresses smoothly when held and springs back when released. Its touch target stays full-size throughout the animation.",
        "Buttons darken while pressed, with independent feedback for simultaneous fingers. Releasing one finger does not release an action still held by another.",
        "Kept the gas-to-handbrake drift slide, reverse pedal behavior, camera look, pause, map and extra driving actions connected to the existing vehicle controls."
      ]
    },
    {
      "title": "Bicycle, motorcycle and e-bike controls",
      "items": [
        "Added separate motorcycle and e-bike controls for twist throttle, reverse, front brake, rear foot brake, lean forward and lean back.",
        "Added bicycle-specific pedal crank, brake lever, reverse and forward/backward rider icons. The bicycle brake operates both existing wheel brakes.",
        "Used the same newly drawn rounded steering arrows across cars, motorcycles, e-bikes and bicycles.",
        "Kept bike jump, exit, camera, map, pause and extra actions available, with independent touches for steering, power, braking and leaning."
      ]
    },
    {
      "title": "Walking, running and actions in City",
      "items": [
        "Anchored the walking joystick center while its outer ring stretches toward the finger, with visual stretch limited to 1.4 times its normal radius.",
        "Added a 10% radial dead zone and proportional walking speed. Running begins past the outer edge and returns to walking below 95% of the radius.",
        "Tracked the captured finger outside the joystick. Releasing or cancelling it stops movement immediately while the thumb and ring spring back visually.",
        "Showed Shoot and Aim only with an equipped gun. Without a gun, Punch occupies the same attack position and Aim disappears; other controls stay in their places.",
        "Cleared held attack and aim during equipment changes before the next simulation step, preventing a held punch from becoming an accidental shot.",
        "Made Crouch a tap-to-toggle control with a persistent highlighted state and retained the existing recovery input.",
        "Placed the Poop and Pee controls beside one another on the main walking HUD, and added a jumping-figure icon with an upward arrow.",
        "Created a consistent set of lightweight vector icons based on the supplied references, embedded directly into the game for offline use.",
        "Kept touch size, opacity and sensitivity preferences; accounted for phone orientation and safe areas. Pause, lost focus, cancelled touches and control-mode changes clear held inputs.",
        "Preserved desktop controls, shared game settings, gameplay physics and single-player/multiplayer input paths."
      ]
    }
  ]
});
