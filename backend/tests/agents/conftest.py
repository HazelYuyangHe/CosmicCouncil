import pytest

import backend.config as config_mod


@pytest.fixture(autouse=True)
def _no_real_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force api key to None for every agent unit test.

    Prevents real Anthropic calls and stops AsyncAnthropic from being
    instantiated, which eliminates the 'Event loop is closed' warnings
    caused by unclosed httpx transports on Windows.

    Tests that need to exercise the LLM code path (e.g. fallback-on-error)
    override this by calling monkeypatch.setattr(..., "sk-ant-fake") inside
    the test body — that value wins for the duration of that test.
    """
    monkeypatch.setattr(config_mod.settings, "anthropic_api_key", None)
