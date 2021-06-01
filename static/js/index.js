// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

    // This is the Vue data.
    app.data = {
        add_mode: false,
        counties: [],
        county_beaches: [],
        current_county: "",
        current_beach: "",
        beach_reviews: [],
        current_beach_id: -1,
        review: "",
        review_title: "",
        login_status: false,
        current_user: "",
        // These three variables are for control flow of uploading image to review
        selected_image: null,
        uploading: false,
        upload_done: false,
        image_to_post: "",
        current_modal: "",
        // Variables for search bar
        query: "",
        results: [],
        // Variable for search bar to activate on correct instance
        is_county: false,
    };


    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };


    app.complete = (a) => {
        a.map((review) => {
            review.liked = false;
        });
    };


    app.decorate = (a) => {
        a.map((review) => {
            review._state = "clean";
        });
        return a;
    };


    app.set_add_status = function (new_status) {
        app.vue.add_mode = new_status;
        app.reset_form();
    };


    app.set_county = function (county_idx) {
        let id = app.vue.counties[county_idx].id;
        app.vue.current_county = app.vue.counties[county_idx].county_name;
        app.vue.county_beaches = [];

        axios.get(load_beaches_url, {params: {id: id}}).then(function (response) {
            app.vue.county_beaches = app.enumerate(response.data.county_beaches);
        });
        // new addition that assists in search bar implementation
        app.vue.is_county = true;
    };


    app.set_beach = function (beach_idx) {
        let id = app.vue.county_beaches[beach_idx].id;
        app.vue.current_beach_id = id;
        app.vue.current_beach = app.vue.county_beaches[beach_idx].beach_name;
        app.vue.beach_reviews = [];

        axios.get(load_reviews_url, {params: {id: id}}).then(function (response){
            // app.vue.beach_reviews = app.enumerate(response.data.beach_reviews);
            let reviews = response.data.beach_reviews;
            app.enumerate(reviews);
            app.complete(reviews);
            app.decorate(reviews);
            app.vue.beach_reviews = reviews;
        }).then(() => {
            for (let review of app.vue.beach_reviews) {
                axios.get(get_likes_url, {params: {"review_id": review.id}}).then((result) => {
                    review.liked = result.data.liked;
                });
            }
        });
    };


    app.add_review = function () {
        axios.post(add_review_url,
            {
                review_title: app.vue.review_title,
                review: app.vue.review,
                beach_id: app.vue.current_beach_id,
                image: app.vue.image_to_post
            }).then(function (response) {
                app.vue.beach_reviews.push({
                    id: response.data.id,
                    review_title: app.vue.review_title,
                    review: app.vue.review,
                    user: response.data.user,
                    liked: false,
                    num_likes: 0,
                    image: app.vue.image_to_post,
                    _state: "clean"
                });
                app.enumerate(app.vue.beach_reviews);
                app.reset_form();
                app.set_add_status(false);
            });
    };


    app.reset_form = function () {
        app.vue.review_title = "";
        app.vue.review = "";
        app.vue.upload_done = false;
        app.vue.selected_image = "";
        app.vue.image_to_post = "";
    };


    app.set_like = function (review_id) {
        let review = app.vue.beach_reviews[review_id];
        axios.post(set_liked_url, {review_id: review.id}).then(function (response) {
            review.liked = response.data.liked,
            review.num_likes = response.data.num_likes
        });
    };


    app.set_login_status = function () {
        app.vue.login_status = true;
        axios.get(get_user_url).then(function (response){
            app.vue.current_user = response.data.current_user;
        })
    };


    app.alert_sign_in = function () {
        alert("Sign in to post/like reviews!");
    };


    app.get_user_name = function (email) {
        let res = email.split('@')
        return res[0];
    }


    app.select_image = function (event) {
        let input = event.target;
        let file = input.files[0];

        if (file) {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                app.vue.image_to_post = reader.result;
            };
            app.vue.selected_image = file.name;
            app.vue.upload_done = true;
        }
    };

    app.set_modal = function (show, id, review_id) {
        let modal;
        if (id == 1) {
            modal = document.getElementById('' + review_id);
        } else {
            modal = document.getElementById('' + review_id);
        }

        if (show) {
            modal.style.display = 'inline-flex';
        } else {
            modal.style.display = 'none';
        }
    }


    app.edit = function (review_id, review_state) {
        if (review_state === "clean") {
            app.vue.beach_reviews[review_id]._state = "edit";
        } else {
            app.vue.beach_reviews[review_id]._state = "clean";
            let review = app.vue.beach_reviews[review_id];

            axios.post(edit_contact_url, {
                id: review.id,
                title: review.review_title,
                review: review.review
            })

        }
    }

    app.search = function () {
        if(app.vue.query.length > 1) {
            axios.get(search_url, {params: {q: app.vue.query}})
                .then(function (result) {
                    app.vue.results = result.data.results
                });
        } else {
            app.vue.results = [];
        }
    };


    app.delete_review = function (review_id) {
        let id = app.vue.beach_reviews[review_id].id;

        axios.get(delete_review_url, {params: {id: id}}).then(function (response) {
            for (let index = 0; index < app.vue.beach_reviews.length; index++) {
                if (app.vue.beach_reviews[index].id === id) {
                    app.vue.beach_reviews.splice(index, 1);
                    app.enumerate(app.vue.beach_reviews);
                    break;
                }
            }
        });
    };


    // This contains all the methods.
    app.methods = {
        set_add_status: app.set_add_status,
        set_county: app.set_county,
        set_beach: app.set_beach,
        add_review: app.add_review,
        set_like: app.set_like,
        set_login_status: app.set_login_status,
        alert_sign_in: app.alert_sign_in,
        get_user_name: app.get_user_name,
        upload_image: app.select_image,
        set_modal: app.set_modal,
        edit: app.edit,
        search: app.search,
        delete_review: app.delete_review,
    };


    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });


    // And this initializes it.
    app.init = () => {
        // Put here any initialization code.
        // Typically this is a server GET call to load the data.
        axios.get(load_counties_url).then(function (response) {
            app.vue.counties = app.enumerate(response.data.counties);
        });
    };


    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
