# Gameplay Description

## Purpose of the game

Defeat an opponent, reducing his health (HP) to 0 by placing cards on the lines and causing damage to his avatar or his cards.

---

## Playing field

The battlefield consists of three battle lines, one cell for each side:

```
   [ P1: Left ]   [ P1: Center ]   [ P1: Right ]
   [ P2: Left ]   [ P2: Center ]   [ P2: Right ]
```

Each cell can only contain one active card. New cards can only be placed in empty cells.

---

## Preparing for the game

1. Both players register and log in.
2. A general match deck is created: 20 random unique cards from the entire available base.
3. Both players receive 4 random cards per hand.
4. A virtual coin is tossed to determine the first player.
5. Health (HP) of both avatars: **20 HP**.
6. Starting mana: **3 units**.

---

## Cards

Each card has:

* Character name and image
* Attack points
* Defense Points
* Draw cost (Cost)

The maximum in hand is **4 cards**. If the hand is full, a new card is not drawn.

---

## Turn of the round (simultaneous moves)

The game takes place in rounds. Time limit for a round: **60 seconds**. In each round, both players act simultaneously. A round consists of the following phases:

1. **Card Draw Phase**:

   * If there are < 4 cards in the hand, one card is drawn from the common deck.
   * If the hand is full, the draw is skipped.

2. **Mana Increase Phase**:

   * Mana increases by 1 (maximum - 10).

3. **Card Placement Phase**:

   * Players simultaneously choose which cards to play.
   * Each card is placed on one of the three lines if there is space and enough mana.

4. **Combat Phase**:

   * The battle takes place **on each line** separately:

     * If there is a map line on both sides - a battle between them:

       * Attack of one card minus defense of another = damage.
       * If defense ≤ 0, the card is destroyed.
     * If the card is opposite an empty cell, it deals damage to the enemy’s avatar (damage = attack).

5. **End of round** - the next round begins.

---

## Example round

* Player 1 (P1):

  * He has 2 mana and cards: Jon Snow (5/3, cost 2), Tyrion Lannister (3/4, cost 1).
  * He selects Jon Snow and puts him in the center lane.

* Player 2 (P2):

  * He has 3 mana and a card: Robb Stark (4/2, cost 2).
  * He also puts Robb Stark in the mid lane.

* **Battle**:

  * Jon Snow (5) vs Robb Stark (2): Robb Stark has 2 - 5 = -3 → Robb Stark destroyed.
  * In the next round, Jon Snow can attack directly if the line is empty.

---

## Restrictions and rules

* There are no more than **4 cards** in your hand.
* On the field there is a maximum of **3 cards for each player** (1 per line).
* Cards cannot be moved between lines.
* Killed cards are removed from the field.
* If the opponent’s line is empty, the card deals damage **to the avatar**.

---

## Ending the game

* The game ends when one of the players has **HP = 0**.
* If both run out of cards and neither one wins - **draw**.