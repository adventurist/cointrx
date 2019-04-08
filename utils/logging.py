import logging


def setup_logger(name, level='INFO', json_logging=False):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    log_handler = logging.FileHandler('bot.log')
    logger_formatter = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
    log_handler.setFormatter(logger_formatter)

    logger.addHandler(log_handler)
    logger.info('Setup logger for ' + name)

    return logger
