{% extends '../admin/layout.swig' %}
{% set title = 'Add Course' %}
{% block page_title %}
	<i class="pe-7s-timer"></i> &nbsp;Add New Course
{% endblock %}

{% block body %}
<style>
	.plus-btn {
		position: relative;
		top: 35px;
		margin-left: 10px;
	}

	.addable {
		display: none;
	}

	fieldset {
		margin-top: 23px;
	}
</style>
<div class="content">
	<div class="container-fluid">
		<div class="row">
			<div class="col-md-12">
				<div class="card">
					<div class="header">
						<h4 class="title"><i class="fa fa-edit"></i>&nbsp; Add New Course</h4>
					</div>
					<div class="row">
						<div class="col-md-12" style="padding: 50px">
							{% include 'forms/course-form.swig' %}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
{% endblock %}

{% block scriptTag %}
<script type="text/javascript">
$(document).ready(function() {

});
</script>
{% endblock %}