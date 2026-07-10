<!-- GENERATED — do not edit. Author examples/all-chart-types.src.md (![[…]] embeds), then run: node scripts/expand-dgmo-embeds.mjs examples/all-chart-types.src.md examples/all-chart-types.md -->

# Diagrammo — All Chart Types

> Every `dgmo` code fence below renders a different chart type, and the prose
> around them shows the Markdown formatting the integration renders alongside
> diagrams. Edit the data to experiment! For the full editor experience visit
> [diagrammo.app](https://diagrammo.app).

---

## Markdown formatting

Diagrams live inside ordinary Markdown, so everything below renders normally
next to the `dgmo` fences — **bold**, *italic*, ~~strikethrough~~, `inline
code`, and [links](https://diagrammo.app).

### Bullet lists & indentation

- Crew roster
  - Captain
    - Quartermaster
    - Boatswain
  - Gunner
- Ship's stores
  - Powder and shot
  - Salt pork and biscuit

### Numbered steps

1. Hoist the colours
2. Come alongside the prize
3. Board and secure the hold
   1. Take the powder room first
   2. Then the captain's cabin

### Task list

- [x] Careen the hull
- [x] Re-tar the rigging
- [ ] Divide the plunder

### Table

| Vessel             | Guns | Crew | Status    |
| ------------------ | ---: | ---: | --------- |
| Queen Anne's Revenge | 40 |  300 | Flagship  |
| Ranger             |   10 |   80 | Consort   |
| Adventure          |    8 |   60 | Captured  |

### Blockquote & code

> A merry life and a short one shall be my motto. — Bartholomew Roberts

```js
const plunder = ships.reduce((sum, s) => sum + s.gold, 0);
```

---

## Data

### Arc Diagram

```dgmo
arc Pirate Alliances

[Caribbean] red
  Blackbeard -> Bonnet    8
  Blackbeard -> Vane      5
  Blackbeard -> Hornigold 4
  Hornigold  -> Bonnet    2

[Women Pirates] green
  Bonny   -> Rackham 9
  Bonny   -> Read    7
  Rackham -> Vane    3

[West Africa] blue
  Roberts -> Davis    6
  Davis   -> Roberts 10
```

### Area Chart (line + fill)

```dgmo
line Tortuga Rum Barrels in Stores
fill
series Barrels
x-label Month
y-label Barrels in Hold

era Jan -> Apr Raiding Season red
era Apr -> Aug Dry Spell blue

Jan 320
Feb 410
Mar 505
Apr 618
May 470
Jun 355
Jul 210
Aug 140
Sep 260
Oct 430
Nov 560
Dec 690
```

### Bar Chart

```dgmo
bar Treasure Hauls by Port

Port Royal blue   850
Tortuga green     620
Nassau red       1100
Havana yellow     430
Cartagena purple  780
```

### Bar Chart (stacked)

```dgmo
bar Plunder by Voyage
x-label Voyage
y-label Doubloons

stack
  Gold red
  Silver orange
  Spices yellow
  Rum green

Spanish Main     480 320 210 150
Barbary Coast    360 290 340 180
Windward Passage 520 410 160 240
Coral Run        300 260 380 200
```

### Bubble Chart (scatter + size)

```dgmo
scatter Pirate Fleets of the Caribbean
x-label Ruthlessness
y-label Plunder (chests)
size-label Crew

[English Pirates] red
  Blackbeard    90  85  300
  Calico Jack   55  32  110
  Anne Bonny    70  28   90

[French Buccaneers] blue
  L'Olonnais         80  60  220
  Pierre le Grand    45  25   70

[Welsh Privateers] green
  Henry Morgan  85  120  470
  Bartholomew Roberts  88  110  510
```

### Arc — Chord Layout

```dgmo
arc Pirate Alliance Network
layout chord

Blackbeard -> Bonnet    150
Blackbeard -> Vane       80
Blackbeard -> Hornigold 120
Bonnet     -> Rackham    40
Vane       -> Rackham    60
Rackham    -> Bonny     200
Bonny      -> Read      180
Roberts    -> Davis      90
Roberts    -> Anstis     70
Hornigold  -> Bonnet     50
Vane       -> Bonny      30
Roberts    -> Rackham    20
Rackham    -> Roberts   100
```

### Doughnut Chart (pie + hole)

```dgmo
pie Plunder Hold Contents
hole 0.5

Gold Doubloons   420
Silver Pieces    260
Spices & Silk    180
Rum Casks        140
Gunpowder         90
Navigation Charts  30
```

### Function Plot

```dgmo
function Cannonball Trajectories by Elevation
x-label Distance (meters)
y-label Height (meters)
x 0 to 250

15 degrees blue: -0.001*x^2 + 0.27*x
30 degrees green: -0.002*x^2 + 0.58*x
45 degrees red: -0.003*x^2 + 0.75*x
```

### Funnel Chart

```dgmo
funnel Pirate Recruitment Pipeline

Port Visitors blue     1000
Tavern Recruits cyan    500
Crew Trials yellow      200
Sworn Pirates orange    100
Veteran Buccaneers red   50
```

### Heatmap

```dgmo
heatmap Pirate Activity by Sea Region
columns Jan, Feb, Mar, Apr, May, Jun

// label value1, value2, ...
Caribbean       5 4 5 3 4 5
Atlantic        2 3 2 4 3 2
Mediterranean   3 2 1 2 3 4
Indian Ocean    4 5 4 5 4 3
South China Sea 1 2 3 2 1 2
West Africa     3 3 4 3 5 4
```

### Line Chart

```dgmo
line Ship Speed Over Voyage
series Knots
x-label Day
y-label Speed

era Day 1 -> Day 3 Rough Seas red 
era Day 3 -> Day 7 Fair Winds blue

Day 1  8
Day 2 10
Day 3  7
Day 4 12
Day 5  9
Day 6 11
Day 7  6
```

### Line Chart (Multi-series)

```dgmo
line Plunder by Crew Over the Voyage
series
  Cutlass Crew blue
  Powder Monkeys green
  Rigging Rats orange
x-label Port of Call
y-label Doubloons (thousands)

Nassau     4.2  1.1  0.6
Tortuga    6.5  1.9  0.9
Port Royal 9.1  3.4  1.7
Isla Muerta 7.8  4.2  2.3
Kingston   11.4  5.1  3.0
```

### Pie Chart

```dgmo
pie Crew Roles Distribution
solid-fill
//no-percent
//no-value

Sailors          45
Gunners          20
Marines          15
Officers          8
Specialists       7
Cooks & Surgeons  5
```

### Polar Area Chart

```dgmo
polar-area Captain's Skills

Navigation    90
Swordsmanship 75
Leadership    85
Cunning       95
Seamanship    80
```

### Radar Chart

```dgmo
radar Ship Combat Rating
solid-fill

Firepower       85
Speed           70
Armor           60
Maneuverability 90
Crew Morale     75
```

### Sankey Diagram

```dgmo
sankey Rum Supply Chain of the Caribbean

// Source — color the plantation node green
Sugar Plantations green
  Tortuga Distillery orange 3000
  Nassau Distillery orange 2500
  Kingston Distillery orange 2000

// Distribution — indented targets under each distillery
Tortuga Distillery
  Pirate Taverns red 2000
  Ship Provisions teal 1000

Nassau Distillery
  Pirate Taverns 1500
  Black Market purple 1000

Kingston Distillery
  Royal Navy blue 1200
  Pirate Taverns 800

// Final destinations
Pirate Taverns
  Crew Morale 3500
  Bar Fights 800 red

Ship Provisions -> Long Voyages 1000
```

### Scatter Plot

```dgmo
scatter Pirate Captains
x-label Ruthlessness
y-label Treasure

[Caribbean] red
  Blackbeard   90  8500
  Calico Jack  55  3200
  Anne Bonny   70  2800
  Henry Morgan 85 12000
  Charles Vane 75  4100


[Atlantic] blue
  Black Sam Bellamy   60  9200
  Bartholomew Roberts 88 11000
  Edward Low          95  5500
  Stede Bonnet        30  1800



[Indian Ocean] green
  Henry Every  80 14000
  William Kidd 65  6800
  Thomas Tew   50  7200
```

### Slope Chart

```dgmo
slope Pirate Fleet Strength: 1715 vs 1725

period
  1715
  1725

Blackbeard red           40  4
Bartholomew Roberts blue 12 52
Charles Vane orange      20  2
Anne Bonny green          8 15
Calico Jack purple       18  6
```

### Treemap

```dgmo
treemap Plunder Spend ($k)

tag Crew as t
  Deck blue
  Guns orange
  Stores green

Sailing & Rigging t: Deck
  Rigging 320
  Helm 180
  Lookout 140
Cannon Battery t: Guns
  Powder 90
  Shot 130
Provisions t: Stores
  Rum 110
  Hardtack 70
```

### Sunburst (treemap radial)

```dgmo
treemap Plunder Spend ($k)
radial

tag Crew as t
  Deck blue
  Guns orange
  Stores green

Sailing & Rigging t: Deck
  Rigging 320
  Helm 180
  Lookout 140
Cannon Battery t: Guns
  Powder 90
  Shot 130
Provisions t: Stores
  Rum 110
  Hardtack 70
```

## Business

### Body

```dgmo
body Powder Monkey Push Day
muscle
front

tag Effort as e
  Primary red
  Secondary orange
  Warm-up yellow

chest        e: Primary
  Barbell bench press — 4×8
deltoids     e: Primary
  Overhead press — 3×10
triceps      e: Secondary
  Rope pushdowns — 3×12
abs          e: Warm-up
  Plank — 3×45s
```

### Cycle Diagram

```dgmo
cycle The Pirate Raid Cycle
solid-fill

Scout blue
  Spot merchant vessels from afar

Pursue green
  Raise the colors, trim the sails

Board orange
  Swing across and seize the deck

Celebrate red
  Divide the spoils, then repair
```

### Family

```dgmo
family The Blackwater Buccaneers

tag Allegiance as flag
  Founders green
  Brethren red
  Crown blue

Redbeard b: 1638, d: 1701, sex: m, occupation: Captain, military: Sacked three ports, flag: Founders
Blackheart Bess b: 1642, d: 1699, sex: f, occupation: Quartermaster, flag: Founders

Redbeard + Blackheart Bess m: 1660
  Anne b: 1662, sex: f, occupation: Pirate King, flag: Brethren
  Mad Mary b: 1665, sex: f, occupation: Powder Monkey

"Long John Silver" b: 1658, sex: m, occupation: Cook
One-Eyed Pete b: 1660, d: 1712, sex: m, occupation: Bosun, flag: Crown

Anne + "Long John Silver" m: 1685
  Young Jack b: 1686, sex: m, occupation: Navigator
  Grace b: 1689, sex: f, occupation: Sailmaker, flag: Brethren

Anne + One-Eyed Pete m: 1698
  Sally b: 1699, sex: f, occupation: Lookout

Mad Mary sex: f
  Tom b: 1690, sex: m, occupation: Cabin Boy

Young Jack + Calico Kate m: 1712
  Ned b: 1713, sex: m, occupation: Gunner
  Pearl adopted, b: 1715, sex: f, occupation: Cartographer
```

### Journey Map

```dgmo
journey-map A Cabin Boy's First Voyage
solid-fill

persona Squidlips Sam color: blue
  Greenhorn cabin boy, first time at sea
  Sworn to the crew but quietly terrified

[Signing On]
  Sign the articles score: 4, emotion: Hopeful
    description: Captain reads the code aloud — pay shares, no women aboard, lights out at 8

[The Tempest]
  Caught in a squall off the reef score: 1, emotion: Terrified
    pain: Two crewmates lost overboard before dawn
    thought: Maybe the merchant fleet wasn't so bad after all
  Dawn, and she still floats score: 3, emotion: Relieved

[The Prize]
  Strike the colors score: 5, emotion: Triumphant
    description: Heavy with silver from the Veracruz mines

[Homecoming]
  Bury a share on the island score: 5, emotion: Proud
    thought: Three doubloons hidden where only he can find them
  Back to the Rusty Anchor score: 4, emotion: Content
    opportunity: Next time he signs on as a full hand, not a boy
```

### Map

```dgmo
map The Brethren's Caribbean

tag Port as p
  Home Port red
  Friendly green
  Spanish Prize orange

tag Passage as l
  Open Sea blue
  Coastal Run teal

poi Kingston p: Home Port, size: 120
poi Havana p: Spanish Prize, size: 90
poi Santo Domingo p: Friendly, size: 70

route Kingston
  ~weigh anchor~> Havana l: Open Sea
  ~raid the galleons~> Santo Domingo l: Coastal Run
  ~careen & resupply~> Kingston l: Open Sea
```

### Org Chart

```dgmo
org The Dread Fleet
solid-fill
sub-node-label Crew
show-sub-node-count

tag Rank as r
  Sailor blue
  Captain red
  FirstMate orange
  Quartermaster yellow
  Bosun green
  Gunner teal
  Jester cyan
  Swab purple

tag Ship as s
  Revenge blue
  Serpent green
  Phantom purple

tag Status as st
  Loyal green
  Turncoat red
  NewRecruit yellow

Blackbeard r: Captain, s: Revenge
  Anne Bonny r: FirstMate
    [Gun Deck]
      Cannonball Pete r: Gunner
      Smokey Jack r: Gunner, st: NewRecruit
      Powder Meg r: Swab, st: NewRecruit
    [Boarding Party]
      Cutlass Jim r: Bosun
      Red Mary
      One-Eyed Dan st: Turncoat
  Calico Rackham r: Quartermaster
    [Cargo Hold]
      Barnacle Bob
      Slippery Sal st: Turncoat
  Long John r: FirstMate, s: Serpent
    [Rigging Crew]
      Monkey Fist r: Bosun
      Pegleg Pete
      Crow Jane
    [Navigation]
      Stargazer Quinn r: Quartermaster
      Compass Rose st: NewRecruit
```

### Pyramid Diagram

```dgmo
pyramid Pirate Crew Hierarchy
solid-fill

Captain purple
  Final word on heading and plunder,
  keeper of the ship's charter.

Quartermaster blue
  Second-in-command, arbitrates
  disputes, divvies the booty.

Boatswain & Gunner green
  Keep the rigging tight and
  the cannons ready.

Able Seamen yellow
  Haul lines, swab decks,
  and stand watch.

Powder Monkeys orange
  Ferry shot and charges to the guns
  during a broadside.
```

### Quadrant Chart

```dgmo
quadrant Crew Performance Assessment
x-label Low Skill, High Skill
y-label Low Loyalty, High Loyalty

top-right Promote green
top-left Train yellow
bottom-left Maroon red
bottom-right Watch Closely purple

Quartermaster  0.9 0.95
Navigator     0.85  0.8
Gunner         0.7  0.6
Surgeon        0.8 0.75
Boatswain      0.6 0.85
Cook           0.4  0.9
New Recruit    0.2  0.5
Troublemaker  0.65  0.2
Spy            0.8  0.1
```

### Ring Diagram

```dgmo
ring Captain's Sphere of Influence

solid-fill 

Captain  red
  Final word on heading and plunder,
  keeper of the ship's charter.

Quartermaster orange
  Second-in-command, arbitrates disputes and divvies the booty

Crew yellow
  Deckhands, gunners, and powder
  monkeys aboard the ship.

Allied Crews green
  Loose alliances kept by oath
  or shared bounty in fair seas.

The Open Sea blue
  Weather, currents, and rival
  flags beyond any captain's reach.
```

### Swimlane

```dgmo
swimlane Weekly Publishing
direction LR

lane Writer gray
lane Editor blue
lane Social green

Writer
  Draft Post
  Revise
Editor
  <Review>
  Schedule
  Publish
Social
  Promote

Draft Post -> <Review>
<Review>
  -changes-> Revise -> <Review>
  -ok-> Schedule -> Publish -> Promote
```

### Tech Radar

```dgmo
tech-radar Pirate Operations Radar — Q2 1718

rings
  Full Sail 
  Trial Run
  Spyglass
  Davy Jones

Tactics quadrant: top-right
  Ambush at Dawn ring: Full Sail, trend: stable
    Our most reliable boarding tactic. **90% success rate** when
    approaching from the east with the sun behind us.
    - Crew morale peaks at dawn — grog hasn't worn off yet
    - Reduced cannon fire needed: *3 volleys* vs 8 at midday
    - See [battle log](https://wiki.pirates.example/dawn-ambush)
  Boarding Parties ring: Full Sail, trend: stable
    Standard 20-man teams equipped with **cutlasses**, *grappling hooks*,
    and smoke pots. Training regimen updated after the *Tortuga Incident*.
  Decoy Flags ring: Trial Run, trend: up
    Flying false colours until within cannon range. Early results
    are promising — merchant ships drop anchor **40% more often**
    when they see a Dutch East India flag.
    - Works best in *foggy conditions*
    - Risk: Royal Navy ships sometimes call the bluff
  Smoke Screens ring: Trial Run, trend: new
    Burning wet straw and tar barrels on approach. Visibility drops to
    **under 10 metres** — perfect for sneaking alongside.
  Kraken Diplomacy ring: Spyglass, trend: new
    Exploring alliances with *sea monsters*. Negotiations ongoing
    but the Kraken's demands are... unreasonable.
    - Wants **50% of all treasure** plus exclusive fishing rights
    - Communication barrier: only speaks in bubbles
  Night Raids ring: Trial Run, trend: up
    Blackened sails and muffled oars. Three successful raids on
    *sleeping harbours* this quarter. Key constraint: **no moonlight**.
  Ramming ring: Davy Jones, trend: down
    Costs more in hull repairs than it's worth. The *HMS Splinter*
    incident of 1716 proved this conclusively.

Vessels quadrant: top-left
  Brigantine ring: Full Sail, trend: stable
    Our workhorse. Fast, manoeuvrable, carries **18 cannons**.
    - Crew capacity: 100 pirates
    - Top speed: *11 knots* in fair wind
    - Draft shallow enough for **coastal ambushes**
  Sloop ring: Full Sail, trend: up
    Fastest ship in the fleet. Only **6 cannons** but can outrun
    anything the Royal Navy sends. Perfect for *reconnaissance*
    and courier runs between hideouts.
  War Galleon ring: Trial Run, trend: up
    Captured from the Spanish fleet. Massive firepower but
    **slow to turn** — best for convoy raids, not chases.
    - 42 cannons across *three gun decks*
    - Requires 200+ crew to operate effectively
    - Ongoing hull repairs from [Battle of Nassau](https://wiki.pirates.example/nassau)
  Frigate ring: Spyglass, trend: new
    Intercepted blueprints from a *British shipyard*. Could be our
    next flagship if we can find enough **seasoned carpenters**.
  Junk Rig ring: Spyglass, trend: new
    Far Eastern design with **battened sails** — easier to handle
    in storms and requires *fewer crew*. Trader Wong demonstrated
    one in Macao harbour.
  Longboat ring: Davy Jones, trend: down
    Too slow, too small, too leaky. Last three longboat missions
    ended in **catastrophic sinkings**. Retired from active duty.

Plunder Targets quadrant: bottom-left
  Merchant Convoys ring: Full Sail, trend: stable
    Core revenue stream — **78% of total plunder**. East India
    Company ships running the spice route remain most lucrative.
    - Average haul: *4,200 doubloons* per convoy
    - Best intercepted near the [Windward Passage](https://wiki.pirates.example/windward)
    - Seasonal peak: July–September during *monsoon trade runs*
  Spanish Treasure Fleets ring: Full Sail, trend: stable
    The **crown jewels** of piracy. Annual fleet carries gold,
    silver, and emeralds from the New World. Requires *coordinated
    multi-ship ambush* but one raid funds operations for a year.
  Port Raids ring: Trial Run, trend: up
    Shifting from sea-only operations. The raid on *Port-de-Paix*
    yielded **12,000 doubloons** and a warehouse of rum.
  Rival Pirates ring: Trial Run, trend: new
    Controversial but profitable. Blackbeard's crew carries
    **more gold** than most merchants. Ethics committee (the parrot)
    has filed an objection.
  Royal Treasury Ships ring: Spyglass, trend: new
    High risk, astronomical reward. Requires:
    - Inside information from *corrupt harbourmasters*
    - At least **3 allied ships** for the blockade
    - A really good escape plan
  Whaling Ships ring: Spyglass, trend: stable
    Moderate value — whale oil fetches **decent prices** in European
    markets. But the ships fight back *hard*.
  Fishing Villages ring: Davy Jones, trend: down
    Terrible ROI and **bad for reputation**. The parrot union
    filed a formal complaint. We're pirates, not bullies.

Crew Welfare quadrant: bottom-right
  Grog Rations ring: Full Sail, trend: stable
    Non-negotiable. Cutting grog rations caused the *Great Mutiny
    of 1716*. Current allocation: **2 pints per day** per pirate.
    - Premium rum reserved for post-battle celebrations
    - Watered grog for the night watch (safety first)
  Code of Conduct ring: Full Sail, trend: stable
    Our **Articles of Agreement** — fair share of plunder, compensation
    for injuries, voting rights on major decisions. *Democracy at sea.*
  Sea Shanty Program ring: Trial Run, trend: new
    Hired a shanty master from *Liverpool*. Crew productivity up
    **25%** during long voyages. Current repertoire:
    - "Yo Ho Ho and a Bottle of Rum" — *morale boost*
    - "What Shall We Do with a Drunken Sailor" — **work efficiency**
    - "Haul Away Joe" — anchor duty motivation
  Dental Plan ring: Spyglass, trend: up
    Exploring options. Most crew down to **4 teeth** on average.
    Parley with a Port Royal dentist scheduled for Q3 1718.
    - Estimated cost: *3 doubloons per extraction*
    - [Tooth census results](https://wiki.pirates.example/dental)
  Parrot Companions ring: Full Sail, trend: up
    Every pirate deserves a **shoulder companion**. Proven benefits:
    - *Scouts* that can spot sails at 3x human range
    - Morale boost: crew happiness up **30%**
    - Built-in alarm system for surprise attacks
  Retirement Fund ring: Spyglass, trend: new
    Proposal to set aside **5% of all plunder** for retirement.
    Controversial — most pirates don't expect to *live that long*.
  Plank Walking ring: Davy Jones, trend: down
    Terrible for recruitment and **crew retention**. Modern pirates
    prefer *marooning* — at least they get a pistol and a bottle.
```

### Venn Diagram

```dgmo
venn Pirate Skill Overlap

Swordsmanship as sw red
Navigation as nav blue
Leadership as lead green

sw + nav        Sea Raiders
nav + lead      Voyager Captains
sw + lead       Buccaneer Chiefs
sw + nav + lead Legendary Pirates
```

### Word Cloud

```dgmo
wordcloud Pirate Skills

// word weight (higher = larger)
swordsmanship 95
navigation    88
seamanship    85
gunnery       80
leadership    75
cartography   70
intimidation  68
sailing       65
plundering    60
knot-tying    55
lookout       50
cooking       45
carpentry     40
fishing       35
```

## Project

### DACI

```dgmo
raci Captain's Council Decisions
roles
  Captain
  Quartermaster
  Navigator
  Bosun

[Raid Planning]
  Choose the next prize
    Navigator: D
    Captain: A
    Quartermaster: C
    Bosun: I
  Set the attack heading
    Navigator: D A
    Captain: C
  Divide the boarding parties
    Bosun: D
    Captain: A
    Quartermaster: C

[Provisioning]
  Ration the grog
    Quartermaster: D A
    Bosun: C
  Restock the powder
    Quartermaster: D
    Captain: A
    Bosun: I
```

### Gantt Chart

```dgmo
 gantt Blackbeard's Blockade — 1718

start 1718-05-01
today-marker 1718-05-15

tag Role as r
  Command red
  Crew blue
  Captives orange

marker 1718-05-14 Ransom Deadline red
era 1718-05-08 -> 1718-05-17 Blockade Active blue

[Preparation] r: Command
  Provision Ship 3d r: Crew, progress: 100
    -> Anchor Fleet 2d r: Crew, progress: 100
  Scout Harbor 3d r: Crew, progress: 100
    -> Position Cannons 3d r: Crew, progress: 100
  Recruit Hands 5d r: Crew, progress: 100

+7d [Blockade] r: Crew
  Seize Merchants 4d progress: 100
    -> Hold Hostages 5d r: Captives, progress: 60
  Patrol Perimeter 9d progress: 75
  Demand Medicine 4d r: Command, progress: 100
    -> Threaten Executions 3d? r: Command, progress: 90

+17d [Resolution] r: Command
  Receive Ransom 2d r: Captives
    -> Release Prisoners 1d r: Captives
      -> Set Sail 0d
  Burn Evidence 2d r: Crew
```

### Kanban Board

```dgmo
kanban Crew Tasks

tag Priority as p
  Low blue
  Medium yellow
  High orange
  Critical red

tag Watch as w
  Morning green
  Afternoon yellow
  Night purple

[Backlog] blue
  Repair the foretops'l p: Low, w: Morning
    Mend after the last storm
  Reinforce the gunwales p: Medium, w: Afternoon

[In Progress] yellow
  Caulk the hull seams p: High, w: Afternoon
    Hold has been taking water
  Restock powder kegs p: High, w: Morning
    Last batch ran damp

[Blocked] red
  Find a new sailmaker p: Critical, w: Morning
    Old one took ill at last port

[Done] green
  Inventory the hold p: Medium, w: Night
  Sharpen the cutlasses p: Low, w: Night
```

### PERT

```dgmo
pert Pirate Voyage to the Atoll
time-unit w
default-confidence medium

voyage approved 0
  -> recruit crew

[outfit ship]
  recruit crew 1 2 4 as rc
    -> load powder
  careen hull 1.5
    -> load powder
  load powder 0.5 1 2
    -> sail to atoll

sail to atoll 5
  -> count gold
  -> repair hull

count gold 1 2 3
  -> divvy shares

repair hull 3
  -> divvy shares

divvy shares 1 2 3
```

### RACI Matrix

```dgmo
raci Voyage Operations
roles
  Cap  red
  QM orange
  Bos  yellow
  Nav  blue
  Crew gray

[Departure] teal
  Plot the course
    Cap: A
    Nav: R
    QM: C
  Provision the hold
    QM: A R
    Cap: C
    Crew: I

[At Sea] purple
  Stand the watch
    Bos: A
    Crew: R
  Mend sail damage
    Bos: A
    Crew: R

[Landfall] green
  Negotiate with port
    Cap: R A
    QM: C
  Inventory the take
    QM: A R
    Crew: I
```

### RASCI

```dgmo
raci Crew Responsibilities — Boarding Raid
roles
  Cap  red
  QM   orange
  Bos  yellow
  Nav  blue
  Gun  purple
  Crew gray

[Approach] teal
  Spot the prize
    Cap: A
    Nav: R
    Bos: S
    Crew: I
  Close the distance
    Nav: A R
    Cap: C
    Bos: S

[Boarding] purple
  Fire a warning shot
    Gun: A R
    Cap: C
    Crew: S
  Swing the grappling lines
    Bos: A R
    Crew: S
    Cap: I
  Storm the deck
    Cap: A
    Bos: R
    Crew: S
    Gun: S

[Plunder] green
  Secure the captives
    QM: A
    Crew: R
    Bos: S
  Tally the take
    QM: A R
    Cap: C
    Crew: S
```

### Timeline

```dgmo
timeline Pirate Campaigns 1717-1719

era 1717-01 -> 1717-12 Golden Age Peak
era 1718-01 -> 1718-12 Royal Navy Response
marker 1718-05 Rogers Arrives Nassau

[Blackbeard]
  1717-03 -> 1717-09 Blockade of Charles Town
  1717-11 Queen Anne's Revenge captured
  1718-01 -> 1718-06 Carolina Coast raids
  1718-11 Last stand at Ocracoke

[Bonnet]
  1717-06 -> 1717-10 First cruise
  1718-03 -> 1718-07 Revenge refitted
  1718-08 -> 1718-10 Cape Fear pursuit
  1718-12 Trial and hanging

[Royal Navy]
  1718-02 -> 1718-06 Fleet assembles
  1718-07 -> 1718-09 Nassau secured
  1718-10 -> 1719-03 Sweep operations
```

## Software

### Boxes and Lines

```dgmo
boxes-and-lines Pirate Fleet Command

tag Status as s
  Operational green
  Damaged orange
  Sunk red
  Building blue default

heat Crew red green
show-values
active-tag Status

Flagship s: Operational, heat: 120
  -> [Harbor Defenses]
  -> IntelNetwork

[Harbor Defenses]
  FortCannon s: Operational, heat: 40
    -> Watchtower
  Watchtower s: Operational, heat: 12
  SeaMines s: Building, heat: 6

IntelNetwork s: Operational, heat: 35
  -> SpyRing
  -> SignalFlags

SpyRing s: Operational, heat: 18
  -> [Harbor Defenses]

SignalFlags s: Damaged, heat: 8
```

### C4 Architecture

```dgmo
c4 Pirate Treasure Map System
solid-fill

tag Scope as sc
  Crew blue
  External gray

Captain is a person description: Commands the fleet and plans raids

TreasureMap is a system description: Tracks buried treasure locations and raid intelligence
  -Views treasure locations-> Captain
  -Sends raid alerts [carrier pigeon]-> Lookout

  containers
    ChartRoom is a container description: Interactive sea chart with treasure markers, tech: Parchment
      -Queries treasure data [secret code]-> Vault

    Vault is a container description: Encrypted treasure ledger and coordinates, tech: Iron Chest
      -Reads/writes [quill and ink]-> TreasureLog

    TreasureLog is a container description: "Stores locations, guard counts, and loot inventories", tech: Leather-Bound Tome

Lookout is an external description: Crow's nest spotter on allied ships, sc: External
  ~Relays sightings to~> Captain

deployment
  Flagship
    container ChartRoom
    container Vault
  SecretCave
    container TreasureLog
```

### Class Diagram

```dgmo
class Ship Class Hierarchy

solid-fill 

interface Vessel
  + sail(): void
  + anchor(): void

abstract Ship implements Vessel
  # name: string
  # crew: number
  + getName(): string

Galleon extends Ship
  - cannons: number
  + fire(): void

Sloop extends Ship
  - speed: number
  + flee(): void

enum ShipType
  Galleon
  Sloop
  Frigate

Ship
  -> ShipType has type
```

### Entity Relationship

```dgmo
er Pirate Fleet

ships
  id int pk
  name varchar
  ship_type varchar
  cannons int
  1-aboard-* crew_members
  1-1 captains
  1-carries-* treasure

captains
  id int pk
  name varchar
  ship_id int fk
  bounty int
  ?-frequents-1 ports
  *-has-1 crew_members 

crew_members
  id int pk
  name varchar
  ship_id int fk
  role varchar nullable

treasure
  id int pk
  name varchar
  value int
  ship_id int fk, nullable

ports
  id int pk
  name varchar
  region varchar unique
  1-docks-* ships
```

### Flowchart

```dgmo
flowchart Mutiny Resolution
direction-tb

(Weigh Anchor) -> [Set Sail] -> <Crew Discontent?>
  -no-> (Reach Port)
  -yes-> [Call a Vote] -> <Vote Outcome?>
    -loyal-> [Hold Steady] -> (Reach Port)
    -mutiny-> [Seize the Ship] -> [Maroon the Captain] -> (Elect New Captain)
```

### Infrastructure Diagram

```dgmo
infra Pirate Communication Network

tag Fleet as f
  Blackbeard red
  Bonny purple
  Rackham blue

Edge
  rps: 200
  -> SignalFlags

SignalFlags f: Blackbeard
  description: Flag semaphore relay — ship-to-ship messaging
  latency-ms: 30000
  -> Flagship
  -> ScoutShip

Flagship f: Blackbeard
  description: Command vessel — decrypts and routes all intelligence
  instances: 1
  max-rps: 50
  latency-ms: 5000
  -> CarrierPigeons
  -> RumRunner

ScoutShip f: Bonny
  description: Fast sloop for reconnaissance
  instances: 2
  max-rps: 30
  latency-ms: 8000
  -> Flagship

CarrierPigeons f: Rackham
  description: Long-range bird relay — messages to allied ports
  buffer: 100
  drain-rate: 12
  retention-hours: 72
  -> TavernNetwork

[Allied Ports]
  instances: 3

  TavernNetwork f: Rackham
    description: Dockside tavern informants across the Caribbean
    max-rps: 20
    latency-ms: 86400000

RumRunner f: Bonny
  description: Smuggler supply line — moves coded messages in rum barrels
  concurrency: 4
  duration-ms: 172800000
  -> TavernNetwork
```

### Mindmap

```dgmo
mindmap Product Strategy

tag Priority as p
  High red
  Medium yellow
  Low green

tag Department as d
  Engineering blue
  Design purple
  Marketing orange

Research d: Marketing
  User Interviews p: High
    Surveys description: Quarterly NPS survey
    Focus Groups
  Competitor Analysis d: Engineering
    Feature Matrix
    Pricing Review
Development p: High, d: Engineering
  MVP Features
    Auth System
      description: Handle login, signup, OAuth flows
    Dashboard
  Nice-to-haves p: Low, collapsed: true
    Dark Mode
    Export PDF
Go-to-Market d: Marketing
  Launch Plan
    Blog Post
    Demo Video description: 2-min product walkthrough
```

### Sequence Diagram

```dgmo
sequence Treasure Hunt App

tag Concern as c
  Search blue
  Claims green
  Notifications orange

User is an actor

[Treasure Service]
  TreasureAPI
  MapDB is a database
  NotifyQueue is a queue

User -Search nearby loot-> WebApp
WebApp -GET /treasures?nearby-> TreasureAPI c: Search
TreasureAPI -Find within 5nm-> MapDB c: Search
note
  - check location
  - use compass
MapDB -3 results-> TreasureAPI
TreasureAPI -locations-> WebApp
WebApp -Show treasure map-> User

== Claim ==

User -Claim chest #42-> WebApp
WebApp -POST /claim-> TreasureAPI c: Claims
if chest available
  TreasureAPI -Set status = claimed-> MapDB c: Claims
  MapDB -OK-> TreasureAPI
  TreasureAPI ~treasure.claimed~> NotifyQueue c: Notifications
  TreasureAPI -Claim accepted-> WebApp
  WebApp -500 doubloons earned!-> User
else
  TreasureAPI -409 Already claimed-> WebApp
  WebApp -Too slow, matey!-> User
```

### Sitemap

```dgmo
sitemap Pirate Bay Trading Co.

tag Access
  Public green
  Crew Only blue
  Captain red

tag Page
  Landing purple
  Form orange
  Content cyan 

Home Access: Public, Page: Landing
  -shop-> Shop
  -join-> Enlist
  -map-> Treasure Map
  -> [Port Market]

[Port Market]
  Shop Access: Public, Page: Content
    -buy-> Checkout

  Checkout Access: Crew Only, Page: Form
    -purchased-> Ship Log 

[Crew Quarters]
  Enlist Access: Public, Page: Form
    -enlisted-> Ship Log

  Ship Log Access: Crew Only, Page: Content
    -voyage-> Treasure Map

  Treasure Map Access: Captain, Page: Content
```

### State Diagram

```dgmo
state Ship Battle Lifecycle
solid-fill

[*] -> Sailing

Sailing
  -enemy spotted-> BattleStations

BattleStations
  -in range-> Engaging
  -enemy retreats-> Sailing

[Combat]
  Engaging
    -alongside-> Boarding
    -hull breach-> Sinking
    -outgunned-> Retreating

  Boarding
    -crew wins-> Victorious
    -crew loses-> Captured

[Aftermath]
  Victorious
    -loot taken-> Sailing

  Retreating
    -escaped-> Sailing
    -caught-> Captured

Captured -> [*]
Sinking -> [*]
```

### Version Control

```dgmo
version-control Feature Branch Workflow

main
  Initial commit
  Add README

develop from main
  Set up CI
  Add test suite

feature/login from develop
  Login form
  Form validation

develop
  merge feature/login
  Address review notes

main
  merge develop tag: v1.0.0
  Hotfix typo type: highlight
```

### Wireframe

```dgmo
wireframe Pirate Crew Portal

[Header]
  The Jolly Roger Crew Hub
  nav
    Dashboard active
    Treasure Map
    Ship Log
    Crew Roster

[Main]
  # Ahoy, Captain!

  Next Raid Target  [Port Royal]
  Estimated Loot  [5000 doubloons] readonly

  {The Revenge | The Serpent | The Phantom}

  <x> Load extra cannons
  < > Fly false colors

  (*) Full crew
  ( ) Skeleton crew

  (Set Sail!)
  (Abort Mission) ghost

  ---

  New to piracy? (Read the Code) ghost
```

### Event Line

```dgmo
event-line Product Milestones
//no-scale
no-box

tag Track as t
  Product blue
  Growth green
  Funding purple

[Early Days]
  2019-03 Idea sketched  t: Product
    A weekend prototype becomes a real plan.
  2019-09 Private beta  t: Product
    First fifty users kick the tires.

[Scaling Up]
  2020-06 Seed round  t: Funding
    **$2M** raised to grow the team.
  2021-01 Public launch  t: Product
    Open to everyone, no waitlist.
  2021-11 100k users  t: Growth
    Word of mouth does the heavy lifting.

[Going Long]
  2023-04 Series A  t: Funding
    Expansion into new markets.
  2024-08 1M users  t: Growth
    A milestone years in the making.

[What's Next]
  TBD Series B  t: Funding
    Raising when the metrics line up — no date yet.
  TBD Mobile app  t: Product
    On the roadmap, not yet scheduled.
```

### Block

```dgmo
block Web Service Architecture

solid-fill

tag Layer as l
  Edge blue
  Service green
  Data orange

[Clients] l: Edge
  [Browser] [Mobile] [CLI]

[Backend] l: Service
  [Auth] [Orders]
  [Inventory] [Billing]

[Data] l: Data collapsed
  [Postgres] [Redis]
```

### Sketch

```dgmo
sketch Plunder Pipeline

tag Crew
  Deck
  Hold

Spyglass Feed shape: database, at: 0 0, crew: Deck
  -sightings-> con
Captain's Console as con at: 2 0, crew: Deck
  -orders-> bq
  -supplies-> armory
Divvy Service as dvy at: 4 0, crew: Hold
  -entries-> ledger

[Below Decks] at: 2 2, crew: Hold
  Booty Queue as bq shape: queue, at: 0 0
    ~haul~> dvy
  Ship Ledger as ledger shape: database, at: 2 0

[Armory] as armory at: 0 2, collapsed
  Powder Store at: 0 0
  Cutlass Rack at: 0 1
```

---

### Error state

> This block is **intentionally invalid** — `piechart` isn't a chart type (it
> should be `pie`). It's included to show how Diagrammo reports a mistake, so you
> know what to look for when a diagram doesn't render.

<!-- dgmo-expect-error -->
```dgmo
piechart Quarterly Revenue
  Q1 40
  Q2 30
  Q3 20
  Q4 10
```
