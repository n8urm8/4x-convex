# Fleet Movement System

## Overview

The fleet movement system allows players to move their fleets between different locations in the galaxy. Movement takes time based on distance and fleet speed, creating strategic decisions about positioning and timing.

## Coordinate System

### Full Coordinate Format
```
G[galaxy]-S[sectorX].[sectorY]-Sys[systemX].[systemY]-P[planetX].[planetY]
```

**Examples:**
- `G1-S5.3-Sys2.7-P1.4` - Galaxy 1, Sector (5,3), System (2,7), Planet (1,4)
- `G2-S1.1-Sys4.2-Star` - Galaxy 2, Sector (1,1), System (4,2), Star (center)

### Coordinate Components

1. **Galaxy Number** (`G[n]`): The galaxy identifier (1, 2, 3, etc.)
2. **Sector Coordinates** (`S[x].[y]`): Position within the galaxy
3. **System Coordinates** (`Sys[x].[y]`): Position within the sector  
4. **Planet/Star Coordinates** (`P[x].[y]` or `Star`): 
   - `P[x].[y]` for planets within the system
   - `Star` for the central star of the system

## Movement Formula

### Distance Calculation

The movement system calculates distance in a hierarchical manner:

#### 1. Cross-Galaxy Movement
```
distance = 1000 (fixed high cost)
```
Moving between different galaxies incurs a massive distance penalty.

#### 2. Cross-Sector Movement (same galaxy)
```
sectorDistance = √((toSectorX - fromSectorX)² + (toSectorY - fromSectorY)²)
systemDistance = √((toSystemX - fromSystemX)² + (toSystemY - fromSystemY)²)
planetDistance = √((toPlanetX - fromPlanetX)² + (toPlanetY - fromPlanetY)²)

distance = (sectorDistance × 100) + systemDistance + (planetDistance × 0.1)
```

#### 3. Same-Sector Movement
```
systemDistance = √((toSystemX - fromSystemX)² + (toSystemY - fromSystemY)²)
planetDistance = √((toPlanetX - fromPlanetX)² + (toPlanetY - fromPlanetY)²)

distance = systemDistance + (planetDistance × 0.1)
```

#### 4. Same-System Movement
```
planetDistance = √((toPlanetX - fromPlanetX)² + (toPlanetY - fromPlanetY)²)

distance = planetDistance × 0.1
```

### Travel Time Calculation

```
baseTimeMinutes = distance / fleetSpeed
travelTime = max(1, baseTimeMinutes) minutes
```

**Where:**
- `fleetSpeed` = speed of the slowest ship in the fleet
- Minimum travel time is 1 minute regardless of distance/speed

### Fleet Speed Determination

The fleet moves at the speed of its **slowest ship**:

```javascript
fleetSpeed = min(ship1.movementSpeed, ship2.movementSpeed, ..., shipN.movementSpeed)
```

This creates strategic decisions about fleet composition:
- Fast scouts can move quickly but have limited combat power
- Heavy battleships are slow but powerful
- Mixed fleets are limited by their slowest component

## Movement Types

### 1. Full Fleet Movement
- Moves the entire fleet as one unit
- Updates the existing fleet's location
- Fleet status becomes `moving` during transit

### 2. Partial Fleet Movement  
- Moves selected ships from a fleet
- Creates a new fleet for the moving ships
- Original fleet remains at current location with remaining ships
- New fleet travels to destination

## Movement States

### Fleet Status During Movement
- **idle**: Fleet is stationary and can accept new orders
- **moving**: Fleet is in transit, cannot be modified or given new orders
- **in-combat**: Fleet is engaged in battle, cannot move
- **destroyed**: Fleet no longer exists

### Movement Completion
Fleets automatically arrive when their `arrivalTime` is reached. Players can manually complete arrival if the time has passed.

## Strategic Considerations

### Speed vs Power Trade-offs
- **Scout Fleets**: Fast ships for reconnaissance and quick strikes
- **Battle Fleets**: Powerful but slow ships for major engagements  
- **Mixed Fleets**: Balanced but limited by slowest ships

### Distance Planning
- **Local Operations**: Stay within same sector for quick repositioning
- **Regional Campaigns**: Cross-sector movement for expansion
- **Galactic Conquest**: Cross-galaxy movement for ultimate expansion

### Timing Coordination
- **Synchronized Attacks**: Coordinate multiple fleets to arrive simultaneously
- **Reinforcement Waves**: Stagger arrivals for sustained pressure
- **Retreat Planning**: Keep fast ships available for emergency evacuation

## Copy/Paste Coordinate System

### Supported Formats
The system accepts coordinates in multiple formats:

1. **Full Format**: `G1-S5.3-Sys2.7-P1.4`
2. **Star Format**: `G1-S5.3-Sys2.7-Star`
3. **System Only**: `G1-S5.3-Sys2.7` (defaults to star)
4. **Comma Separated**: `1,5,3,2,7,1,4` (galaxy,sectorX,sectorY,systemX,systemY,planetX,planetY)
5. **Space Separated**: `1 5 3 2 7 1 4`

### Copy Utility
Players can copy coordinates from:
- Fleet current locations
- Planet/system views
- Other players' shared coordinates
- Battle reports and logs

### Paste Parsing
The coordinate input automatically detects and parses:
- Formatted coordinate strings
- Raw number sequences
- Partial coordinates (fills in defaults)

## Examples

### Example 1: Local Planet Movement
```
From: G1-S2.3-Sys1.1-P2.2
To:   G1-S2.3-Sys1.1-P3.1
Distance: √((3-2)² + (1-2)²) × 0.1 = √2 × 0.1 ≈ 0.14
Time: 0.14 / fleetSpeed (minimum 1 minute)
```

### Example 2: Cross-System Movement
```
From: G1-S2.3-Sys1.1-Star
To:   G1-S2.3-Sys4.2-P1.1  
Distance: √((4-1)² + (2-1)²) + (√((1-0)² + (1-0)²) × 0.1)
        = √(9+1) + (√2 × 0.1)
        = 3.16 + 0.14 = 3.3
Time: 3.3 / fleetSpeed minutes
```

### Example 3: Cross-Sector Movement
```
From: G1-S1.1-Sys2.2-Star
To:   G1-S3.4-Sys1.1-P2.3
Distance: (√((3-1)² + (4-1)²) × 100) + √((1-2)² + (1-2)²) + (√((2-0)² + (3-0)²) × 0.1)
        = (√(4+9) × 100) + √(1+1) + (√(4+9) × 0.1)  
        = (3.61 × 100) + 1.41 + 0.36
        = 361 + 1.41 + 0.36 = 362.77
Time: 362.77 / fleetSpeed minutes
```

## Technical Implementation

### Database Schema
```typescript
// Fleet location
currentSystemId: Id<'sectorSystems'>
currentGalaxyNumber: number
currentSectorX: number  
currentSectorY: number
currentSystemX: number
currentSystemY: number
currentPlanetX?: number  // New: planet coordinates
currentPlanetY?: number  // New: planet coordinates
isAtStar: boolean        // New: true if at star, false if at planet

// Movement destination  
destinationSystemId?: Id<'sectorSystems'>
destinationGalaxyNumber?: number
destinationSectorX?: number
destinationSectorY?: number  
destinationSystemX?: number
destinationSystemY?: number
destinationPlanetX?: number  // New: destination planet
destinationPlanetY?: number  // New: destination planet
destinationIsAtStar?: boolean // New: destination type
```

### API Changes
```typescript
// Updated movement mutation
moveFleetWithShips({
  fleetId: Id<'fleets'>,
  shipIds: Id<'playerShips'>[],
  destinationCoordinates: {
    galaxyNumber: number,
    sectorX: number,
    sectorY: number, 
    systemX: number,
    systemY: number,
    planetX?: number,    // New: optional planet coordinates
    planetY?: number,    // New: optional planet coordinates
    isAtStar?: boolean   // New: true for star, false for planet
  }
})
```