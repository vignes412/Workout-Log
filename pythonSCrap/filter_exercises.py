import csv

# Input and output file paths
input_file = "c:\\backup\\Workout Log\\pythonSCrap\\exercises.csv"
unique_file = "c:\\backup\\Workout Log\\pythonSCrap\\unique_exercises.csv"
repeated_file = "c:\\backup\\Workout Log\\pythonSCrap\\repeated_exercises.csv"

# Initialize sets and lists
seen_exercises = set()
unique_exercises = []
repeated_exercises = []

# Read the input file and process rows
with open(input_file, mode="r", newline="", encoding="utf-8") as infile:
    reader = csv.reader(infile)
    header = next(reader)  # Extract header
    unique_exercises.append(header)  # Add header to unique file
    repeated_exercises.append(header)  # Add header to repeated file

    for row in reader:
        exercise_name = row[1]  # Assuming 'Exercise' is the second column
        if exercise_name in seen_exercises:
            repeated_exercises.append(row)
        else:
            seen_exercises.add(exercise_name)
            unique_exercises.append(row)

# Write unique exercises to the unique file
with open(unique_file, mode="w", newline="", encoding="utf-8") as outfile:
    writer = csv.writer(outfile)
    writer.writerows(unique_exercises)

# Write repeated exercises to the repeated file
with open(repeated_file, mode="w", newline="", encoding="utf-8") as outfile:
    writer = csv.writer(outfile)
    writer.writerows(repeated_exercises)

print(f"Unique exercises saved to: {unique_file}")
print(f"Repeated exercises saved to: {repeated_file}")
