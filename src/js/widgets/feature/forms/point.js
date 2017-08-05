/**
 * Created by maddoxw on 7/21/17.
 */

'use strict'

import $ from 'jquery'
import point_templates from '../pointtemplates'
import Name from '../nodes/name'
import Type from '../nodes/featuretype'

const form_elements = {}

class Point {
  constructor () {
    this.type = 'point'
    this.form_nodes = {
      'name': new Name(point_templates),
      'type': new Type(point_templates)
    }
    this.form_node_labels = [
      ['name'],
      ['type']
    ]
  }
  createForm () {
    const $form = $("<form id='featureproperties' class='form'>")
    for (let label in this.form_nodes) {
      form_elements[label] = this.form_nodes[label].createNode()
    }
    for (let row_node_labels of this.form_node_labels) {
      $form.append(this.addFormRow(row_node_labels))
    }
    return $form
  }
  addFormRow (labels) {
    const $formRow = $("<div class='form-row'>")
    for (let label of labels) {
      $formRow.append(form_elements[label])
    }
    return $formRow
  }
  styleForm () {
    for (let label in this.form_nodes) {
      this.form_nodes[label].styleNode()
    }
  }
  activateForm (feature) {
    $('#featureproperties').show()
    for (let label in this.form_nodes) {
      this.form_nodes[label].activateNode(feature)
    }
  }
  loadFeature (feature) {
    for (let label in this.form_nodes) {
      this.form_nodes[label].loadFeature(feature)
    }
  }
  deactivateForm () {
    for (let label in this.form_nodes) {
      this.form_nodes[label].deactivateNode()
    }
    $('.form-label').addClass('disabled')
  }
}

export default Point
