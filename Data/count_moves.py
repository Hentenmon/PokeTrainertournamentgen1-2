from collections import Counter

move_counter = Counter()

with open("output.txt", "r", encoding="utf-8") as f:
    for line in f:
        parts = line.strip().split("|") 
        if len(parts) > 2 and parts[1] == "move":  
            move_name = parts[3] 
            move_counter[move_name] += 1

print("Most used moves:")
for move, count in move_counter.most_common(165):
    print(f"{move}: {count}")