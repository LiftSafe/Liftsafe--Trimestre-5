// Agrega los matchers de jest-dom (toBeInTheDocument, toHaveTextContent, ...)
import '@testing-library/jest-dom/vitest'

// En equipos lentos (o con la cobertura activa) MUI tarda más de 1 s en pintar los
// datos simulados: findBy*/waitFor esperan hasta 5 s antes de dar la prueba por fallida.
import { configure } from '@testing-library/react'
configure({ asyncUtilTimeout: 5000 })
