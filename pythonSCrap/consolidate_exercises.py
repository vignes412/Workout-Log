import pandas as pd

# File paths
unique_exercises_path = r"c:\\backup\\Workout Log\\pythonSCrap\\unique_exercises.csv"
repeated_exercises_path = r"c:\\backup\\Workout Log\\pythonSCrap\\repeated_exercises.csv"
output_path = r"c:\\backup\\Workout Log\\pythonSCrap\\consolidated_exercises.csv"

# Load CSV files
unique_exercises = pd.read_csv(unique_exercises_path)
repeated_exercises = pd.read_csv(repeated_exercises_path)

# Merge repeated_exercises with unique_exercises on the 'Exercise' column
merged = repeated_exercises.merge(
    unique_exercises,
    on="Exercise",
    how="left",
    suffixes=("_repeated", "_unique")
)

# Ensure all columns from unique_exercises are present in the merged DataFrame
for column in unique_exercises.columns:
    if column != "Muscle_Group":  # Keep Muscle_Group from repeated_exercises
        if f"{column}_repeated" in merged.columns and f"{column}_unique" in merged.columns:
            merged[column] = merged[f"{column}_repeated"].combine_first(merged[f"{column}_unique"])
        elif column in merged.columns:  # Handle cases where suffixes are not added
            merged[column] = merged[column]

# Preserve Muscle_Group from repeated_exercises
merged["Muscle_Group"] = merged["Muscle_Group_repeated"]

# Ensure the final DataFrame has all columns from unique_exercises
for column in unique_exercises.columns:
    if column not in merged.columns:
        merged[column] = None  # Add missing columns with default None values

# Drop intermediate columns with suffixes
merged = merged[unique_exercises.columns]

# Save the consolidated data to a new file
merged.to_csv(output_path, index=False)
print(f"Consolidated file saved to: {output_path}")
