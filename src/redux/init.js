import { factory } from './factory'
import { map } from 'lodash/fp'

export default function initialize(options = {}, plugins = []) {

    const instances = map((plugin) => plugin.fn(options[plugin.name]), plugins)

    return factory(instances)
}