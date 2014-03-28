import time
import unittest
import mock
import redis
import requests

from . import test_utils
from ...tests.test_utils import skipIfPy3, skipIfPyPy
from ..app import bokeh_app
from ..models import user
from .. import models

import sys


class TestUser(test_utils.BokehServerTestCase):
    def setUp(self):
        super(TestUser, self).setUp()
        self.client = bokeh_app.servermodel_storage
    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_cant_create_twice(self):
        model = user.new_user(self.client, 'test@test.com', 'mypassword',
                              docs=[1,2,3])
        self.assertRaises(models.UnauthorizedException, user.new_user,
                          self.client, 'test@test.com', 'mypassword')
    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_auth_user(self):
        self.assertRaises(models.UnauthorizedException,
                          user.auth_user,
                          self.client, 'test@test.com', 'mypassword')
        model = user.new_user(self.client, 'test@test.com', 'mypassword')
        assert model.username == 'test@test.com'
        model = user.auth_user(self.client, 'test@test.com', 'mypassword')
        self.assertRaises(models.UnauthorizedException, user.auth_user,
                          self.client, 'test@test.com', 'wrongpassword')


