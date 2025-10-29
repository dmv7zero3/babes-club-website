## Push Your Changes to GitHub

# 1. Stage all changes (new, modified, deleted files)

git add .

# 2. Commit with a descriptive message (replace YOUR_MESSAGE below)

git commit -m "YOUR_MESSAGE"

# 3. Add the GitHub remote for the Life Missions International repo (only if you haven't added it already)

# Replace <remote-name> with a name you prefer. Example uses: life-missions

git remote add <remote-name> https://github.com/dmv7zero3/life-missions-international.git

# If the remote name already exists and you need to update its URL, run:

git remote set-url <remote-name> https://github.com/dmv7zero3/life-missions-international.git

# NOTE: Do not clone or fetch from that repo if you were instructed not to download from it — these commands only add it as a push target.

# 4. Push your current branch (main) to that remote and set upstream

git push -u <remote-name> main

# 5. (Optional) Also push to the repository's existing 'origin' if needed

git push origin main

# Quick example (copy/paste):

# git remote add life-missions https://github.com/dmv7zero3/life-missions-international.git

# git push -u life-missions main
