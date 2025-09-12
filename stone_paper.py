import random
import os

# ASCII art for the choices
ROCK = """
    _______ 
---'   ____
      (____)
      (____)
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

CHOICES_ART = {"stone": ROCK, "paper": PAPER, "scissors": SCISSORS}
OPTIONS = ["stone", "paper", "scissors"]
SCORE_FILE = "scores.txt"

def clear_screen():
    """Clears the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

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

def determine_winner(user_choice, computer_choice):
    """Determines the winner of the round."""
    if user_choice == computer_choice:
        return "draw"
    elif (user_choice == "stone" and computer_choice == "scissors") or \
         (user_choice == "paper" and computer_choice == "stone") or \
         (user_choice == "scissors" and computer_choice == "paper"):
        return "user"
    else:
        return "computer"

def display_choices(user_choice, computer_choice):
    """Displays the choices with ASCII art side-by-side."""
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

def play_game():
    """Main function to run the game."""
    user_score, computer_score = load_scores()

    while True:
        clear_screen()
        print("==================================================")
        print("         Welcome to Stone, Paper, Scissors!")
        print("==================================================")
        print(f"Current Score: You {user_score} - {computer_score} Computer")
        print("--------------------------------------------------")

        user_choice = get_user_choice()
        computer_choice = get_computer_choice()

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
