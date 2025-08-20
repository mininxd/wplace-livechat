javascript:(function(){
    const repoUrl = 'YOUR_GITHUB_REPO_URL_HERE'; // e.g., 'https://github.com/user/repo'
    const scriptUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com') + '/main/dist/script.build.user.js';

    fetch(scriptUrl)
        .then(r => r.text())
        .then(code => eval(code))
        .catch(err => console.error('Error loading Wplace Live Chat script:', err));
})();
