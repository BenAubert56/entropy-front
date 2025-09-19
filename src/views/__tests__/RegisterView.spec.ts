import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import RegisterView from '../RegisterView.vue'

function makeInputStub(defaultType: string) {
  return defineComponent({
    name: `${defaultType}-input-stub`,
    inheritAttrs: false,
    props: {
      modelValue: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () =>
        h('input', {
          ...attrs,
          type: (attrs?.type as string) ?? defaultType,
          value: props.modelValue,
          onInput: (event: Event) => {
            const target = event.target as HTMLInputElement
            emit('update:modelValue', target.value)
          },
        })
    },
  })
}

const ProgressBarStub = defineComponent({
  name: 'progress-bar-stub',
  inheritAttrs: false,
  props: {
    value: { type: Number, default: 0 },
    showValue: { type: Boolean, default: false },
  },
  setup(props, { attrs }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: [attrs?.class, 'progress-stub'],
          'data-value': props.value,
        },
        props.showValue ? `${props.value}` : undefined,
      )
  },
})

const stubs = {
  Password: makeInputStub('password'),
  InputText: makeInputStub('text'),
  ProgressBar: ProgressBarStub,
}

const strongPassword = 'AbcdEf12!@34'

describe('RegisterView', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined)
  })

  it('désactive le bouton de soumission par défaut', () => {
    const wrapper = mount(RegisterView, { global: { stubs } })
    const submit = wrapper.get('button.submit')
    expect(submit.attributes('disabled')).toBeDefined()
  })

  it('affiche une erreur quand le nom est trop court', async () => {
    const wrapper = mount(RegisterView, { global: { stubs } })
    const nameInput = wrapper.get('input#name')
    await nameInput.setValue('A')
    await wrapper.vm.$nextTick()
    const error = wrapper.get('small.error')
    expect(error.text().toLowerCase()).toContain('veuillez entrer au moins 2')
  })

  it('active le bouton quand toutes les règles sont satisfaites', async () => {
    const wrapper = mount(RegisterView, { global: { stubs } })
    await wrapper.get('input#name').setValue('Alice')
    await wrapper.get('input#pwd').setValue(strongPassword)
    await flushPromises()

    const hints = wrapper.findAll('.hints li')
    expect(hints.length).toBeGreaterThan(0)
    expect(hints.every((li) => li.classes().includes('ok'))).toBe(true)

    const submit = wrapper.get('button.submit')
    expect(submit.attributes('disabled')).toBeUndefined()

    const entropyBar = wrapper.get('.entropy-bar')
    expect(entropyBar.attributes()['data-value']).toBe('100')

    const redundancyBar = wrapper.get('.redundancy-bar')
    expect(Number(redundancyBar.attributes()['data-value'])).toBeLessThanOrEqual(20)
  })

  it('empêche la soumission quand le mot de passe est faible', async () => {
    const wrapper = mount(RegisterView, { global: { stubs } })
    await wrapper.get('input#name').setValue('Alice')
    await wrapper.get('input#pwd').setValue('abc')
    await flushPromises()

    const submit = wrapper.get('button.submit')
    expect(submit.attributes('disabled')).toBeDefined()

    const hints = wrapper.findAll('.hints li')
    expect(hints.some((li) => !li.classes().includes('ok'))).toBe(true)
  })
})
