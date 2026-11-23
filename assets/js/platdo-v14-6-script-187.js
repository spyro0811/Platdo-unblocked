window.PlatdoReleaseData.unshift({
  "id": "v11-6-driving-smooth",
  "version": 11.6,
  "date": "2026-11-21",
  "major": false,
  "title": "No more freezes when cars and people load in while driving, and solid walls round the house stairs",
  "thumbnail": "assets/images/426d31c17714ba469dc0.jpg",
  "thumbnailAlt": "Traffic on a City street: cars in their own colours on the road beside the pavement",
  "summary": "Driving fast used to freeze the picture again and again as new cars and people came into view, because each car's 3D model took 10 to 50 ms to build and each nearby person 7 to 60 ms. Car models are now built while the City loads and reused, and while you drive fast new people start with a light model. In a test drive at 30 m/s the slow frames dropped from 418 to 101 out of 600. Also, the walls round the stairs in every house no longer show the sky or the grass through a gap.",
  "sections": [
    {
      "title": "Smooth driving",
      "items": [
        "Why it froze: every car, van, bike or boat that came into view had its 3D model built on the spot (10 to 50 ms, two or three frames frozen), and every person close enough a detailed model (7 to 60 ms). At speed that happens all the time.",
        "Now one model of every land vehicle and boat is built while the City loads (about a second more on the loading screen) and kept; when a car leaves the view its model is kept too, and the next car of the same kind takes it and gets its own paint. If a model does have to be built, only one is built a frame.",
        "While you drive faster than about 30 km/h, people seen for the first time get a light model (3 to 5 ms) and are only given their detailed model once you slow down; up close on foot nothing changes.",
        "Measured on this PC driving 600 frames at 30 m/s along the longest road: slow frames (over 28 ms) 418 before, 101 now; the slowest one in a hundred went from 69 ms to 37 ms; time spent building car models 312 ms to 42 ms, people 985 ms to 118 ms. Cars keep their own colours (checked car by car)."
      ]
    },
    {
      "title": "Houses",
      "items": [
        "In every house you could see out through the wall round the stairwell: a strip of sky under the ceiling when you looked up the stairs, and grass when you looked down from upstairs. That band of wall between the two floors is now there."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "No change to the multiplayer server: keep the V11.4 server zip. Online games get the smooth driving too, since it is all in the game.",
        "The map change you asked for (the empty far right of the island) is not in this version; I am checking with you which part to remove first.",
        "This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
