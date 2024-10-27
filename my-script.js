function select_theme_based_on_time() {
    let current_hr = (new Date()).getHours();
    let given_themes = ["hint-of-blue", "hint-of-red"]; // "red", "orange", "blue", "purple", 
    // let selected_theme = given_themes[[Math.floor(Math.random() * given_themes.length)]] // Random theme
    let selected_theme = given_themes[0];

    // Time based theme
    if (current_hr >= 6 && current_hr < 18) {
        selected_theme = given_themes[0];
    }


    document.querySelector("html").setAttribute("selected_theme", selected_theme);
}

select_theme_based_on_time();