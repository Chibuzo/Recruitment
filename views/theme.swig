<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Global site tag (gtag.js) - Google Analytics -->

    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-130160982-1"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'UA-130160982-1');
    </script>
{% block head %}

	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->

	<title>Get Qualified - {{ title }}</title>

	<!-- Google font -->
	<link href="https://fonts.googleapis.com/css?family=Montserrat:400,700%7CVarela+Round" rel="stylesheet">

	<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
	<link rel="icon" href="/favicon.ico" type="image/x-icon">

	<!-- Bootstrap -->
	<link type="text/css" rel="stylesheet" href="/css/bootstrap.min.css" />

	<!-- Owl Carousel -->
	<link type="text/css" rel="stylesheet" href="/css/owl.carousel.css" />
	<link type="text/css" rel="stylesheet" href="/css/owl.theme.default.css" />

	<!-- Magnific Popup -->
	<link type="text/css" rel="stylesheet" href="/css/magnific-popup.css" />

	<!-- Font Awesome Icon -->
	<link rel="stylesheet" href="/css/font-awesome.min.css">

	<!-- Custom stlylesheet -->
	<link type="text/css" rel="stylesheet" href="/css/style.css" />

	<!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
	<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
	<!--[if lt IE 9]>
	<script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
	<script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
	<![endif]-->

	<style>
		#about {
			/*background: #f0f0f0;*/
			padding: 40px 20px;
			font-size: 17px;
			font-weight: 100;
			line-height: 25px;
			text-align: center;
		}

		.section img {
			width: 100%;
		}
	</style>
{% endblock %}
</head>
<!--Start of Tawk.to Script-->
<script type="text/javascript">
	var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
	(function(){
		var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
		s1.async=true;
		s1.src='https://embed.tawk.to/5a79e0cf4b401e45400cb9b6/default';
		s1.charset='UTF-8';
		s1.setAttribute('crossorigin','*');
		s0.parentNode.insertBefore(s1,s0);
	})();
</script>
<!--End of Tawk.to Script-->
<body>
<!-- Header -->
<header id="home">
	<!-- Background Image -->
	{% block backgroud %} {% endblock %}
	<!-- /Background Image -->

	<!-- Nav -->
	<nav id="nav" class="navbar nav-transparent">
		<div class="container">

			<div class="navbar-header">
				<!-- Logo -->
				<div class="navbar-brand">
					<a href="/">
						<img class="logo" src="/images/logo.png" alt="logo">
						<img class="logo-alt" src="/images/gq-logo-alt.png" alt="logo">
					</a>
				</div>
				<!-- /Logo -->

				<!-- Collapse nav button -->
				<div class="nav-collapse">
					<span></span>
				</div>
				<!-- /Collapse nav button -->
			</div>

			<!--  Main navigation  -->
			<ul class="main-nav nav navbar-nav navbar-right">
				<li><a href="/">Home</a></li>
				<li><a href="/candidates">Candidates</a></li>
				<li><a href="/jobs">Jobs</a></li>
				<li><a href="/courses">Courses</a></li>
				<!--<li><a href="/faq">FAQ</a></li>-->
				{% if req.session.fname && req.session.user_type == 'Applicant' %}
					<li><a href="/applicant/dashboard"><i class="fa fa-home"></i> {{ req.session.fname }}</a></li>
				{% else %}
					<li><a href="/login"><i class="fa fa-user"></i> Sign In</a></li>
				{% endif %}
				{#<li><a href="#contact">Contact</a></li>#}
			</ul>
			<!-- /Main navigation -->

		</div>
	</nav>
	<!-- /Nav -->

	<!-- Header -->


{% block body %} {% endblock %}
	<!-- Footer -->
	<footer id="footer" class="sm-padding bg-dark">

		<!-- Container -->
		<div class="container">

			<!-- Row -->
			<div class="row">

				<div class="col-md-12">

					<!-- footer logo -->
					<div class="footer-logo">
						<a href="index.html"><img src="/images/gq-logo-alt.png" alt="logo"></a>
					</div>
					<!-- /footer logo -->

					<!-- footer follow
					<ul class="footer-follow">
						<li><a href="#"><i class="fa fa-facebook"></i></a></li>
						<li><a href="#"><i class="fa fa-twitter"></i></a></li>
						<li><a href="#"><i class="fa fa-linkedin"></i></a></li>
						<li><a href="#"><i class="fa fa-youtube"></i></a></li>
					</ul>
					/footer follow -->

					<!-- footer copyright -->
					<div class="footer-copyright">
						<p>Copyright © 2018. All Rights Reserved.</p>
					</div>
					<!-- /footer copyright -->

				</div>

			</div>
			<!-- /Row -->

		</div>
		<!-- /Container -->

	</footer>
	<!-- /Footer -->

	<!-- Back to top -->
	<div id="back-to-top"></div>
	<!-- /Back to top -->

	<!-- Preloader -->
	{#<div id="preloader">#}
		{#<div class="preloader">#}
			{#<span></span>#}
			{#<span></span>#}
			{#<span></span>#}
			{#<span></span>#}
		{#</div>#}
	{#</div>#}
	<!-- /Preloader -->

	<!-- jQuery Plugins -->
	<script type="text/javascript" src="/js/jquery-3.min.js"></script>
	<script type="text/javascript" src="/js/bootstrap.min.js"></script>
	<script type="text/javascript" src="/js/owl.carousel.min.js"></script>
	<script type="text/javascript" src="/js/jquery.magnific-popup.js"></script>
	<script type="text/javascript" src="/js/main.js"></script>

	<script>
		!function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t){var e=document.createElement("script");e.type="text/javascript";e.async=!0;e.src=("https:"===document.location.protocol?"https://":"http://")+"cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};analytics.SNIPPET_VERSION="4.0.0";
			analytics.load("iLqyt3EWQouph8sRkjBgCz7XL09rmv4p");
			analytics.page();
		}}();
	</script>
</body>

{% block scriptTag %} {% endblock %}
</html>
