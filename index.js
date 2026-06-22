const core = require('@actions/core');

async function checkPRApproval(owner, repo, prNumber, approvedUsers, githubToken) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const reviews = await response.json();
    
    // Check if any approved user has approved the PR
    for (const review of reviews) {
      if (review.state === 'APPROVED' && approvedUsers.includes(review.user.login)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    core.warning(`Failed to check PR approval: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    // Check if we have the required inputs for PR approval checking
    const githubToken = core.getInput('githubToken');
    const approvedUsers = core.getInput('approvedUsers');
    
    // Parse approved users list
    const approvedUsersList = approvedUsers.split(',').map(user => user.trim());
    
    // Get repository and PR information from GitHub context
    const { GITHUB_REPOSITORY, GITHUB_EVENT_PATH } = process.env;
    
    if (GITHUB_REPOSITORY && GITHUB_EVENT_PATH) {
      const [owner, repo] = GITHUB_REPOSITORY.split('/');
      
      // Read the event file to get PR number
      const fs = require('fs');
      const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
      const prNumber = eventData.pull_request?.number;
      
      if (prNumber) {
        const hasApproval = await checkPRApproval(owner, repo, prNumber, approvedUsersList, githubToken);
        
        if (hasApproval) {
          core.info('Release is near, but PR has approval from authorized user. Proceeding with merge.');
          return;
        } else {
          core.setFailed(core.getInput('onBlockedMessage'));
        }
      } else {
        core.warning('Could not determine PR number from event context');
        core.setFailed(core.getInput('onBlockedMessage'));
      }
    } else {
      core.warning('GitHub repository context not available');
      core.setFailed(core.getInput('onBlockedMessage'));
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
