# Database description

## Basic tables

---

### 1. users

Stores user data

- id
- login
- password_hash
- email
- avatar_url

| Field            | Type         | Description               |
|------------------|--------------|---------------------------|
| `id`             | INT PK       | Unique ID                 |
| `login`          | VARCHAR      | Login (nickname)          |
| `password_hash ` | VARCHAR      | Hashed password           |
| `email`          | VARCHAR      | E-mail                    |
| `avatar_url`     | VARCHAR      | Avatar link               |

---

### 2. cards

Information about all cards in the game

- id
- name
- image_url
- attack
- defense
- cost

| Field         | Type         | Description                |
|---------------|--------------|----------------------------|
| `id`          | INT PK       | Unique card ID             |
| `name`        | VARCHAR      | Character name             |
| `image_url`   | VARCHAR      | Link to card image         |
| `attack`      | INT          | Attack Points              |
| `defense`     | INT          | Defence Points             |
| `cost`        | INT          | Card cost                  |

---

### 3. games

Information about games between players

- id
- player1_id
- player2_id
- player1_health
- player2_health
- winner_id
- turn_user_id
- deck_id
- started_at
- ended_at
- status

| Field           | Type          | Description                                    |
|-----------------|---------------|------------------------------------------------|
| `id`            | INT PK        | Unique game ID                                 |
| `player1_id`    | INT FK        | Player 1 (FK -> `users.id`)                    |
| `player2_id`    | INT FK        | Player 2 (FK -> `users.id`)                    |
| `player1_health`| INT           | Player 1 health                                |
| `player2_health`| INT           | Player 2 health                                |
| `winner_id`     | INT FK NULL   | game winner (or NULL) (FK -> `users.id`)       |
| `turn_user_id`  | INT FK        | Whose turn is it now (FK -> `users.id`)        |
| `deck_id`       | INT FK        | Game Deck ID (FK -> `decks.id`)                |
| `started_at`    | DATETIME      | Game start time                                |
| `ended_at`      | DATETIME NULL | Game end time (or NUL)                         |
| `status`        | VARCHAR       | Game status (`waiting`, `active`, `finished`)  |

---

### 4. decks

Stores a deck of cards that is randomly generated and used in a specific game

- id
- game_id

| Field        | Type     | Description                     |
|--------------|----------|---------------------------------|
| `id`         | INT PK   | Unique deck ID                  |
| `game_id`    | INT FK   | Game ID (FK -> `games.id`)      |

---

### 5. deck_cards

Associates the deck with specific cards

- id
- deck_id
- card_id
- position

| Field        | Type     | Description                  |
|--------------|----------|------------------------------|
| `id`         | INT PK   | Unique record ID             |
| `deck_id`    | INT FK   | Deck ID (FK -> `decks.id`)   |
| `card_id`    | INT FK   | Card ID (FK -> `cards.id`)   |
| `position`   | INT      | Card position in the deck    |

---

### 6. hands

Cards held by players during a game

- id
- game_id
- user_id
- card_id
- position

| Field      | Type         | Description                    |
|------------|--------------|--------------------------------|
| `id`       | INT PK       | Unique record ID               |
| `game_id`  | INT FK       | Game ID  (FK -> `games.id`)    |
| `user_id`  | INT FK       | Player ID (FK -> `users.id`)   |
| `card_id`  | INT FK       | Card ID (FK -> `cards.id`)     |
| `position` | INT          | Card position in hand (1..N)   |

--- 

### 7. played_cards

Cards played by players on the field during the game 

- id
- game_id
- user_id
- card_id
- damage_dealt
- turn_number

| Field          | Type         | Description                                    |
|----------------|--------------|------------------------------------------------|
| `id`           | INT PK       | Unique record ID                               |
| `game_id`      | INT FK       | Game ID  (FK -> `games.id`)                    |
| `user_id`      | INT FK       | Player who played the card (FK -> `users.id`)  |
| `card_id`      | INT FK       | Card ID (FK -> `cards.id`)                     |
| `damage_dealt` | INT          | Damage dealt                                   |
| `turn_number`  | INT          | Turn number                                    |

---

### 8. game_log

History of moves and actions of players in a game

- id
- game_id
- user_id
- id
- id

| Field      | Type         | Description                                         |
|------------|--------------|-----------------------------------------------------|
| `id`       | INT PK       | Unique record ID                                    | 
| `game_id`  | INT FK       | Game ID  (FK -> `games.id`)                         |
| `user_id`  | INT FK       | The player who took the action (FK -> `users.id`)   |
| `action`   | TEXT         | Description of action                               |
| `timestamp`| DATETIME     | Action time                                         |

--- 

## Connections

- A deck (`decks`) is created for each game (`games`).
- `deck_cards` contains all the cards in the deck from which the players' hands are formed.
- Cards in hand (`hands`) and on the field (`played_cards`) are taken from the game deck.
- The `games` table references the deck via `deck_id`.