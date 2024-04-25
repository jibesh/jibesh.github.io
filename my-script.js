function select_random_theme() {
    let given_themes = ["theme_5"];
    let selected_theme = given_themes[[Math.floor(Math.random() * given_themes.length)]]
    document.querySelector("html").setAttribute("selected_theme", selected_theme);
}

select_random_theme();