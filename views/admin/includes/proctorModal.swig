<div class="modal fade in" id="proctorModal" tabindex="-1" role="dialog" aria-labelledby="remoteModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-hidden="true">
					×
				</button>
				<h4 class="modal-title" id="myModalLabel">Invigilation Details</h4>
			</div>

			<div class="modal-body">
				<span id="proctor-id" class="hidden"></span>
				<span id="candidate-id" class="hidden"></span>

				<ul class="nav nav-tabs">
					<li class="active"><a href="#profile-photo" data-toggle="tab">Profile Photo</a></li>
					<li><a href="#photo" data-toggle="tab">Photos</a></li>
					<li><a href="#audio" data-toggle="tab">Audios</a></li>
				</ul>
				<div class="tab-content">
					<div class="tab-pane fade active in" id="profile-photo">
						<div class="row" id="profile-pic">
							<div class="col-md-6" id="profilePhoto"></div>
						</div>
					</div>
					<div class="tab-pane fade in" id="photo">
						<div class="row">
							<div class="col-md-12 stats-info">
							</div>
						</div>
						<div class="row" id="photos"></div>
					</div>

					<div class="tab-pane fade in" id="audio">
						<div class="row">
							<div class="col-md-12 stats-info">
							</div>
						</div>
						<div class="row" id="audios"></div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">
					<i class="fa fa-times"></i> Close
				</button>
			</div>
		</div>
	</div>
</div>
