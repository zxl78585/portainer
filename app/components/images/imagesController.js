angular.module('images', [])
.controller('ImagesController', ['$scope', '$state', '$filter', 'ImageService', 'Notifications', 'PaginationService', 'ModalService',
function ($scope, $state, $filter, ImageService, Notifications, PaginationService, ModalService) {
  // $scope.state = {};
  // $scope.state.pagination_count = PaginationService.getPaginationCount('images');
  // $scope.sortType = 'RepoTags';
  // $scope.sortReverse = true;
  // $scope.state.selectedItemCount = 0;

  $scope.formValues = {
    Image: '',
    Registry: ''
  };


  $scope.renderFieldId = function(item, value) {
    return '<span class="monospaced">' + $filter('truncate')(value, 20) + '</span>';
  };

  $scope.renderLabel = function(item) {
    if (item.ContainerCount === 0) {
      return '<span style="margin-left: 10px;" class="label label-warning image-tag">Unused</span>';
    }
    return '';
  };

  $scope.renderRepoTagsField = function(item, value) {
    if (!value || value.length === 0 || value[0] === '<none>:<none>') {
      return '-';
    }

    var render = '';
    for (var i = 0; i < value.length; i++) {
      if (i > 1) {
        render += '+' + (value.length - 2) + ' more';
        break;
      }
      var tag = value[i];
      render += '<span class="label label-primary image-tag">' + $filter('truncate')(tag, 40) + '</span>';
    }
    return render;
  };

  // $scope.order = function(sortType) {
  //   $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
  //   $scope.sortType = sortType;
  // };
  //
  // $scope.changePaginationCount = function() {
  //   PaginationService.setPaginationCount('images', $scope.state.pagination_count);
  // };
  //
  // $scope.selectItems = function (allSelected) {
  //   angular.forEach($scope.state.filteredImages, function (image) {
  //     if (image.Checked !== allSelected) {
  //       image.Checked = allSelected;
  //       $scope.selectItem(image);
  //     }
  //   });
  // };
  //
  // $scope.selectItem = function (item) {
  //   if (item.Checked) {
  //     $scope.state.selectedItemCount++;
  //   } else {
  //     $scope.state.selectedItemCount--;
  //   }
  // };

  $scope.pullImage = function() {
    $('#pullImageSpinner').show();
    var image = $scope.formValues.Image;
    var registry = $scope.formValues.Registry;
    ImageService.pullImage(image, registry, false)
    .then(function success(data) {
      Notifications.success('Image successfully pulled', image);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to pull image');
    })
    .finally(function final() {
      $('#pullImageSpinner').hide();
    });
  };

  $scope.confirmRemovalAction = function (force) {
    ModalService.confirmImageForceRemoval(function (confirmed) {
      if(!confirmed) { return; }
      $scope.removeAction(force);
    });
  };

  $scope.removeAction = function (force) {
    force = !!force;
    $('#loadImagesSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $state.reload();
      }
    };
    angular.forEach($scope.images, function (i) {
      if (i.Checked) {
        counter = counter + 1;
        ImageService.deleteImage(i.Id, force)
        .then(function success(data) {
          Notifications.success('Image deleted', i.Id);
          var index = $scope.images.indexOf(i);
          $scope.images.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove image');
        })
        .finally(function final() {
          complete();
        });
      }
    });
  };

  function fetchImages() {
    $('#loadImagesSpinner').show();
    var endpointProvider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    ImageService.images(true)
    .then(function success(data) {
      $scope.images = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve images');
      $scope.images = [];
    })
    .finally(function final() {
      $('#loadImagesSpinner').hide();
    });
  }

  fetchImages();
}]);
