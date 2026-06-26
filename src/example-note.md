# Diagrammo — All Chart Types

> Every `dgmo` code fence below renders a different chart type.
> Edit the data to experiment! For the full editor experience visit [diagrammo.app](https://diagrammo.app).

---

# Data

## Arc Diagram

```dgmo
arc Pirate Alliances

[Caribbean] red
  Blackbeard -> Bonnet     8
  Blackbeard -> Vane       5
  Blackbeard -> Hornigold  4
  Hornigold  -> Bonnet     2

[Women Pirates] purple
  Bonny   -> Rackham 9
  Bonny   -> Read    7
  Rackham -> Vane    3

[West Africa] teal
  Roberts -> Davis    6
  Davis   -> Roberts 10
```

---

## Area Chart

```dgmo
area Fleet Growth Over Time
series Ships
x-label Year

era 1710 -> 1716 Rise green
era 1716 -> 1720 Decline red

1710  3
1712  5
1714  9
1716 14
1718  8
1720  4
```

---

## Bar Chart

```dgmo
bar Treasure Hauls by Port
series Gold Doubloons

Port Royal blue    850
Tortuga green      620
Nassau red        1100
Havana yellow      430
Cartagena purple   780
```

---

## Bar Chart (Stacked)

```dgmo
bar-stacked Port Revenue by Trade
orientation-horizontal
series
  Imports blue
  Exports green
  Tariffs orange

Port Royal 300 450  80
Tortuga    150 200  30
Nassau     400 350 120
Havana     500 600 150
```

---

## Bubble Chart

```dgmo
scatter Pirate Fleets of the Caribbean
size-label Crew
x-label Firepower
y-label Reputation

[English Pirates] red
  Blackbeard   85 90 80
  Calico Jack  45 55 35
  Anne Bonny   50 70 30
  Charles Vane 60 65 45

[French Buccaneers] blue
  L'Olonnais         70 80 60
  Michel de Grammont 55 60 40
  Pierre le Grand    30 45 25
```

---

## Chord Diagram

```dgmo
chord Pirate Alliance Network

Blackbeard -- Bonnet 150
Blackbeard -- Vane 80
Blackbeard -- Hornigold 120
Bonnet -- Rackham 40
Vane -- Rackham 60
Rackham -- Bonny 200
Bonny -- Read 180
Roberts -- Davis 90
Roberts -- Anstis 70
Hornigold -- Bonnet 50
Vane -- Bonny 30
Roberts -> Rackham 20
Rackham -> Roberts 100
```

---

## Doughnut Chart

```dgmo
doughnut Plunder Distribution
solid-fill

Captain's Share 40
Quartermaster   20
Crew Split      25
Ship Repairs    10
Provisions       5
```

---

## Function Plot

```dgmo
function Cannonball Trajectories by Elevation
x-label Distance (meters)
y-label Height (meters)
x 0 to 250

15 degrees blue: -0.001*x^2 + 0.27*x
30 degrees green: -0.002*x^2 + 0.58*x
45 degrees red: -0.003*x^2 + 0.75*x
```

---

## Funnel Chart

```dgmo
funnel Pirate Recruitment Pipeline

Port Visitors blue         1000
Tavern Recruits cyan        500
Crew Trials yellow          200
Sworn Pirates orange        100
Veteran Buccaneers red       50
```

---

## Heatmap

```dgmo
heatmap Pirate Activity by Sea Region
columns Jan, Feb, Mar, Apr, May, Jun

Caribbean       5 4 5 3 4 5
Atlantic        2 3 2 4 3 2
Mediterranean   3 2 1 2 3 4
Indian Ocean    4 5 4 5 4 3
South China Sea 1 2 3 2 1 2
West Africa     3 3 4 3 5 4
```

---

## Line Chart

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

---

## Line Chart (Multi-series)

```dgmo
line Monthly Captures by Fleet
series Blackbeard red, Roberts blue, Vane green
x-label Month

era Jan -> Mar Atlantic Season
era Mar -> Jun Caribbean Season teal

Jan 3 5 2
Feb 4 3 4
Mar 2 7 3
Apr 6 4 1
May 5 6 5
Jun 3 8 2
```

---

## Pie Chart

```dgmo
pie Crew Roles Distribution
solid-fill

Sailors          45
Gunners          20
Marines          15
Officers          8
Specialists       7
Cooks & Surgeons  5
```

---

## Polar Area Chart

```dgmo
polar-area Captain's Skills

Navigation    90
Swordsmanship 75
Leadership    85
Cunning       95
Seamanship    80
```

---

## Radar Chart

```dgmo
radar Ship Combat Rating
solid-fill

Firepower       85
Speed           70
Armor           60
Maneuverability 90
Crew Morale     75
```

---

## Sankey Diagram

```dgmo
sankey Rum Supply Chain of the Caribbean

Sugar Plantations green
  Tortuga Distillery orange 3000
  Nassau Distillery orange 2500
  Kingston Distillery orange 2000

Tortuga Distillery
  Pirate Taverns red 2000
  Ship Provisions teal 1000

Nassau Distillery
  Pirate Taverns 1500
  Black Market purple 1000

Kingston Distillery
  Royal Navy blue 1200
  Pirate Taverns 800

Pirate Taverns
  Crew Morale 3500
  Bar Fights 800 red

Ship Provisions -> Long Voyages 1000
```

---

## Scatter Plot

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

---

## Slope Chart

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

---

## Treemap

```dgmo
treemap Plunder Allocation

tag Crew as t
  Deck blue
  Gunners green
  Officers orange

Deck Hands t: Deck
  Riggers 320
  Swabs 180
  Lookouts 140
Gun Crews t: Gunners
  Cannoneers 90
  Powder Monkeys 130
Officers t: Officers
  Quartermaster 110
  Bosun 70
```

---

# Business

## Cycle Diagram

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

---

## Journey Map

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

---

## Map

```dgmo
map The Brethren's Caribbean

tag Port as p
  Home Port red
  Friendly green
  Spanish Prize orange

poi Kingston p: Home Port, value: 120
poi Havana p: Spanish Prize, value: 90
poi Santo Domingo p: Friendly, value: 70

route Kingston
  ~weigh anchor~> Havana
  ~raid the galleons~> Santo Domingo
  ~careen & resupply~> Kingston
```

---

## Org Chart

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

---

## Pyramid Diagram

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

---

## Quadrant Chart

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

---

## Ring Diagram

```dgmo
ring Captain's Sphere of Influence
solid-fill

Captain red
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

---

## Swimlane

```dgmo
swimlane Expense Approval
direction LR

lane Employee gray
lane Manager blue
lane Finance green

[Submit]
  Employee
    File Expense
[Review]
  Manager
    <Approve>
    (!Rejected)
[Pay]
  Finance
    Reimburse
    (Paid) success

File Expense -> <Approve>
<Approve>
  -deny-> (!Rejected)
  -approve-> Reimburse -> (Paid)
```

---

## Tech Radar

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
  Boarding Parties ring: Full Sail, trend: stable
    Standard 20-man teams equipped with **cutlasses**, *grappling hooks*,
    and smoke pots.
  Decoy Flags ring: Trial Run, trend: up
    Flying false colours until within cannon range. Merchant ships
    drop anchor **40% more often** when they see a Dutch East India flag.
  Night Raids ring: Trial Run, trend: up
    Blackened sails and muffled oars.
  Ramming ring: Davy Jones, trend: down
    Costs more in hull repairs than it's worth.

Vessels quadrant: top-left
  Brigantine ring: Full Sail, trend: stable
    Our workhorse. Fast, manoeuvrable, **18 cannons**.
  Sloop ring: Full Sail, trend: up
    Fastest ship in the fleet. Perfect for *reconnaissance*.
  War Galleon ring: Trial Run, trend: up
    Captured from the Spanish fleet. Massive firepower.
  Longboat ring: Davy Jones, trend: down
    Too slow, too small, too leaky.

Plunder Targets quadrant: bottom-left
  Merchant Convoys ring: Full Sail, trend: stable
    Core revenue stream — **78% of total plunder**.
  Spanish Treasure Fleets ring: Full Sail, trend: stable
    The **crown jewels** of piracy.
  Port Raids ring: Trial Run, trend: up
    Shifting from sea-only operations.
  Fishing Villages ring: Davy Jones, trend: down
    Terrible ROI and **bad for reputation**.

Crew Welfare quadrant: bottom-right
  Grog Rations ring: Full Sail, trend: stable
    Non-negotiable. Current allocation: **2 pints per day** per pirate.
  Code of Conduct ring: Full Sail, trend: stable
    Our **Articles of Agreement** — fair share, fair vote.
  Sea Shanty Program ring: Trial Run, trend: new
    Hired a shanty master from *Liverpool*. Productivity up **25%**.
  Plank Walking ring: Davy Jones, trend: down
    Terrible for recruitment and **crew retention**.
```

---

## Venn Diagram

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

---

## Word Cloud

```dgmo
wordcloud Pirate Skills

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

---

# Project

## DACI

```dgmo
raci Captain's Council Decisions
variant-daci
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

---

## Gantt Chart

```dgmo
gantt Blackbeard's Blockade — 1718

start 1718-05-01
today-marker 1718-05-15

tag Role as r
  Command red
  Crew blue
  Captives orange

marker 1718-05-22 Ransom Deadline red
era 1718-05-10 -> 1718-05-18 Blockade Active blue

[Preparation] r: Command
  Anchor Fleet 7d progress: 100
    -> Deploy Sloops 4d r: Crew, progress: 100

[Blockade] r: Crew
  Seize Merchants 12d progress: 80
  Hold Hostages 8d r: Captives, progress: 60

[Negotiations] r: Command
  Demand Medicine 8d progress: 50
    -> Threaten Executions 6d? progress: 40

[Resolution] r: Command
  Receive Ransom 3d r: Captives
    -> Release Prisoners 0d
```

---

## Kanban Board

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
  Restock powder kegs p: High, w: Morning
    Last batch ran damp
  Caulk the hull seams p: High, w: Afternoon
    Hold has been taking water

[Blocked] red
  Find a new sailmaker p: Critical, w: Morning
    Old one took ill at last port

[Done] green
  Inventory the hold p: Medium, w: Night
  Sharpen the cutlasses p: Low, w: Night
```

---

## PERT

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

---

## RACI Matrix

```dgmo
raci Voyage Operations
roles
  Cap  red
  QM   orange
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
    Cap: A R
    QM: C
  Inventory the take
    QM: A R
    Crew: I
```

---

## RASCI

```dgmo
rasci Voyage Preparation
roles
  Captain
  Quartermaster
  Bosun
  Cook
  Surgeon

[Outfitting]
  Provision the hold
    Quartermaster: A R
    Cook: S
    Captain: C
  Mend the sails
    Bosun: A R
    Quartermaster: C

[At Sea]
  Tend the wounded
    Surgeon: A R
    Cook: S
    Captain: I
  Stand the night watch
    Bosun: A R
    Quartermaster: S
```

---

## Timeline

```dgmo
timeline The Golden Age of Piracy (1716–1722)
scale on

tag Pirate as p
  Blackbeard red
  Bonny & Rackham purple
  Roberts blue

tag Outcome as o
  Uncertain yellow
  Victory green
  Defeat red

tag Theatre as t
  Caribbean teal
  Atlantic blue
  Africa orange

era 1716->1718 Nassau Republic
era 1719->1722 Roberts Era

marker 1718-07 Woodes Rogers arrives orange
marker 1721-08 Roberts reaches peak teal

1716 -> 1717 Sails under Hornigold p: Blackbeard, o: Victory
1717-11 -> 1718-06 Commands Queen Anne's Revenge p: Blackbeard, o: Victory, t: Atlantic
1718-05 Blockades Charleston harbor p: Blackbeard, o: Victory
1718-11-22 Killed at Ocracoke p: Blackbeard, o: Defeat
1718 -> 1719 Rackham builds crew in Nassau p: Bonny & Rackham, o: Victory
1719-03 -> 1720-10? Bonny & Rackham raid together p: Bonny & Rackham
1720-11 Rackham hanged at Port Royal p: Bonny & Rackham, o: Defeat
1719-06 -> 1720 Raids West African coast p: Roberts, o: Victory, t: Africa
1720 -> 1722 Captures 400+ ships p: Roberts, o: Victory, t: Atlantic
1722-02-10 Killed at Cape Lopez p: Roberts, o: Defeat, t: Africa
```

---

# Software

## Boxes and Lines

```dgmo
boxes-and-lines Pirate Fleet Command

tag Status as s
  Operational green
  Damaged orange
  Sunk red
  Building blue default

Flagship s: Operational
  -> [Harbor Defenses]
  -> IntelNetwork

[Harbor Defenses]
  FortCannon s: Operational
    -> Watchtower
  Watchtower s: Operational
  SeaMines s: Building

IntelNetwork s: Operational
  -> SpyRing
  -> SignalFlags

SpyRing s: Operational
  -> [Harbor Defenses]

SignalFlags s: Damaged
```

---

## C4 Architecture

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

    TreasureLog is a container description: Stores locations, guard counts, and loot inventories, tech: Leather-Bound Tome

Lookout is an external description: Crow's nest spotter on allied ships, sc: External
  ~Relays sightings to~> Captain

deployment
  Flagship
    container ChartRoom
    container Vault
  SecretCave
    container TreasureLog
```

---

## Class Diagram

```dgmo
class Ship Class Hierarchy

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

---

## Entity Relationship

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

---

## Flowchart

```dgmo
flowchart Mutiny Resolution
direction-tb

[Sail] Set sail under the captain
{Trouble?} Discontent in the crew?
[Hold]   Hold steady, stay loyal
{Vote}   Crew vote called
[Mutiny] Seize the ship
[Maroon] Maroon the captain
[New]    Elect a new captain

(Sail) -> (Trouble?)
(Trouble?) -No-> (Sail)
(Trouble?) -Yes-> (Vote)
(Vote) -Stay-> (Hold)
(Vote) -Mutiny-> (Mutiny)
(Mutiny) -> (Maroon)
(Maroon) -> (New)
(New) -> (Sail)
(Hold) -> (Sail)
```

---

## Infrastructure Diagram

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

---

## Mindmap

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

---

## Sequence Diagram

```dgmo
sequence Treasure Hunt App

tag Concern as c
  Search blue
  Claims green
  Notifications orange

tag Layer as l
  Frontend teal
  Backend purple
  Data red

User is an actor
WebApp l: Frontend
TreasureAPI l: Backend
MapDB is a database l: Data
NotifyQueue is a queue l: Backend

User -Search nearby loot-> WebApp
WebApp -GET /treasures?nearby-> TreasureAPI c: Search
note
  - check location
  - use compass
TreasureAPI -Find within 5nm-> MapDB c: Search
MapDB -3 results-> TreasureAPI
TreasureAPI -locations-> WebApp
WebApp -Show treasure map-> User

== Claim ==

User -Claim chest #42-> WebApp
WebApp -POST /claim-> TreasureAPI c: Claims
if chest available
  TreasureAPI -Set status = claimed-> MapDB c: Claims
  MapDB -OK-> TreasureAPI
  TreasureAPI -Claim accepted-> WebApp
  WebApp -500 doubloons earned!-> User
  TreasureAPI ~treasure.claimed~> NotifyQueue c: Notifications
else
  TreasureAPI -409 Already claimed-> WebApp
  WebApp -Too slow, matey!-> User
```

---

## Sitemap

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

---

## State Diagram

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

---

## Version Control

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

---

## Wireframe

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

---

## Block

```dgmo
block Web Service Architecture

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

---

## Event Line

```dgmo
event-line A Short History of the Web
no-scale

tag Theme as t
  Protocol blue
  Browser green
  Platform purple
  Standard orange

[The Early Web]
  1991 WorldWideWeb  t: Protocol
    Tim Berners-Lee publishes the first website at CERN.
  1993 Mosaic  t: Browser
    The first popular graphical browser.

[The Standards Era] collapsed: true
  1995 JavaScript  t: Platform
    Brendan Eich writes the language in ten days.
  1996 CSS  t: Standard
    Styling splits from structure.

[The App Era]
  2005 Ajax  t: Platform
    XMLHttpRequest updates pages without a reload.
  2014 HTML5  t: Standard
    The living standard — video, canvas, semantics.
```
