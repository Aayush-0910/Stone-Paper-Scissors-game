import random
import os
import time

# ASCII art for the choices
ROCK = """
    _______ 
---'   ____)
      (_____)
      (_____)
      (____)
---.__(___)
"""

PAPER = """
    _______ 
---'   ____)____
          ______)
          _______)
         _______)
---.__________)
"""

SCISSORS = """
    _______ 
---'   ____)____
          ______)
       __________)
      (____)
---.__(___)
"""

SHAKE1 = """
    _______ 
---'   ____)
      (_____)
      (_____)
      (____)
---.__(___)
"""

SHAKE2 = """
    _______ 
---'   ____)
      (_____)
     (_____)
      (____)
---.__(___)
"""

SHAKE3 = """
    _______ 
---'   ____)
      (_____)
      (_____)
     (____)
---.__(___)
"""

CHOICES_ART = {"stone": ROCK, "paper": PAPER, "scissors": SCISSORS}
OPTIONS = ["stone", "paper", "scissors"]
SCORE_FILE = "scores.txt"


def clear_screen():
    """Clears the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')


def play_animation():
    """Displays a countdown and shaking animation."""
    clear_screen()
    print("Rock...")
    time.sleep(0.5)
    clear_screen()
    print("Paper...")
    time.sleep(0.5)
    clear_screen()
    print("Scissors...")
    time.sleep(0.5)
    clear_screen()

    shaking_hands = [SHAKE1, SHAKE2, SHAKE3]
    for i in range(3):
        print(shaking_hands[i % 3])
        time.sleep(0.2)
        clear_screen()


def get_user_choice():
    """Gets and validates the user's choice."""
    while True:
        user_choice = input("Enter your choice (stone/paper/scissors): ").lower()
        if user_choice in OPTIONS:
            return user_choice
        print(f"Invalid choice! Please enter one of: {', '.join(OPTIONS)}.")


def get_computer_choice():
    """Gets a random choice for the computer."""
    return random.choice(OPTIONS)


def display_choices(user_choice, computer_choice):
    """Displays the choices with ASCII art side-by-side."""
    clear_screen()
    user_art_lines = CHOICES_ART[user_choice].splitlines()
    computer_art_lines = CHOICES_ART[computer_choice].splitlines()

    print("\n" + " " * 5 + "YOUR CHOICE" + " " * 15 + "COMPUTER'S CHOICE")
    print(" " * 5 + "-----------" + " " * 15 + "-----------------")

    for i in range(max(len(user_art_lines), len(computer_art_lines))):
        user_line = user_art_lines[i] if i < len(user_art_lines) else ""
        computer_line = computer_art_lines[i] if i < len(computer_art_lines) else ""
        print(f"{user_line:<25} {computer_line}")


def load_scores():
    """Loads player and computer scores from a file."""
    try:
        with open(SCORE_FILE, 'r') as f:
            player_score = int(f.readline().strip())
            computer_score = int(f.readline().strip())
        return player_score, computer_score
    except (FileNotFoundError, ValueError):
        return 0, 0


def save_scores(player_score, computer_score):
    """Saves player and computer scores to a file."""
    with open(SCORE_FILE, 'w') as f:
        f.write(str(player_score) + '\n')
        f.write(str(computer_score) + '\n')


def determine_winner(user_choice, computer_choice):
    """Determines the winner of a round."""
    if user_choice == computer_choice:
        return "draw"
    elif (user_choice == "stone" and computer_choice == "scissors") or \
         (user_choice == "scissors" and computer_choice == "paper") or \
         (user_choice == "paper" and computer_choice == "stone"):
        return "user"
    else:
        return "desktop"


def play_game():
    """Main function to run the game."""
    user_score, computer_score = load_scores()

    while True:
        print("==================================================")
        print("         Welcome to Stone, Paper, Scissors!")
        print("==================================================")
        print(f"Current Score: You {user_score} - {computer_score} Computer")
        print("--------------------------------------------------")

        user_choice = get_user_choice()
        computer_choice = get_computer_choice()

        play_animation()
        display_choices(user_choice, computer_choice)

        winner = determine_winner(user_choice, computer_choice)

        if winner == "user":
            print("\n✨ YOU WIN THIS ROUND! ✨")
            user_score += 1
        elif winner == "computer":
            print("\n💔 COMPUTER WINS THIS ROUND! 💔")
            computer_score += 1
        else:
            print("\n🤝 IT'S A DRAW! 🤝")

        save_scores(user_score, computer_score)

        print("--------------------------------------------------")
        
        while True:
            play_again = input("Play another round? (yes/no): ").lower()
            if play_again in ["yes", "no"]:
                break
            print("Invalid input. Please enter 'yes' or 'no'.")

        if play_again != "yes":
            break

    clear_screen()
    print("==================================================")
    print("                 GAME OVER!")
    print("==================================================")
    print(f"Final Score: You {user_score} - {computer_score} Computer")
    if user_score > computer_score:
        print("\n🏆 Congratulations! You won the game overall! 🏆")
    elif computer_score > user_score:
        print("\n💻 Better luck next time! The computer won overall. 💻")
    else:
        print("\n🤝 The game ended in an overall draw! 🤝")
    print("==================================================")


if __name__ == "__main__":
    play_game()
